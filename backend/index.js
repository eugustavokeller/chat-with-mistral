import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
  console.log("Recebendo prompt:", prompt);

  try {
    console.log("Fazendo requisição para Ollama...");
    const ollamaResponse = await fetch("http://ollama:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: prompt,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama response error: ${ollamaResponse.statusText}`);
    }

    console.log("Ollama response status:", ollamaResponse.status);

    // Configurar headers para streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    console.log("Iniciando stream de resposta...");
    let chunkCount = 0;

    for await (const chunk of ollamaResponse.body) {
      chunkCount++;
      const chunkStr = chunk.toString();
      console.log(`Chunk ${chunkCount}:`, chunkStr);

      try {
        const data = JSON.parse(chunkStr);
        if (data.response) {
          console.log("Enviando resposta:", data.response);
          res.write(`data: ${JSON.stringify({ response: data.response })}\n\n`);
        }
      } catch (parseError) {
        console.error("Erro ao parsear chunk:", parseError);
      }
    }

    console.log("Stream finalizado. Total de chunks:", chunkCount);
    res.end();
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    res.status(500).json({ error: "Erro ao processar a requisição" });
  }
});

app.listen(3001, () => console.log("🚀 Backend rodando na porta 3001"));
