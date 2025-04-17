import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Chat with Ollama
router.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Received prompt:", prompt);

    console.log("Making request to Ollama API...");
    const ollamaResponse = await fetch("http://ollama:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama2",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }

    console.log("Ollama API response status:", ollamaResponse.status);

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let chunkCount = 0;
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log("Received chunk:", chunk);
      chunkCount++;

      try {
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.message && data.message.content) {
            res.write(
              `data: ${JSON.stringify({ content: data.message.content })}\n\n`
            );
          }
        }
      } catch (error) {
        console.error("Error parsing chunk:", error);
      }
    }

    console.log("Total chunks received:", chunkCount);
    res.end();
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
