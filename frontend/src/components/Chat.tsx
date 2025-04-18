import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Message from "./Message";
import ChatInput from "./ChatInput";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessages([]);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedMessages);
      } else {
        console.error("Invalid messages format:", data);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    setLoading(true);
    try {
      // Save user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          sessionId: "default",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let assistantMessage = "";
        const assistantMessageId = (Date.now() + 1).toString();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          try {
            // Handle SSE format by removing 'data:' prefix if present
            const cleanChunk = chunk.startsWith("data:")
              ? chunk.slice(5).trim()
              : chunk;
            const data = JSON.parse(cleanChunk);
            assistantMessage += data.content;

            setMessages((prev) => {
              const filtered = prev.filter(
                (msg) => msg.id !== assistantMessageId
              );
              return [
                ...filtered,
                {
                  id: assistantMessageId,
                  role: "assistant",
                  content: assistantMessage,
                  timestamp: new Date(),
                },
              ];
            });
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat with AI
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300">
              Welcome, {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                    Start a conversation
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                    Type a message to begin chatting with the AI
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <ChatInput onSendMessage={handleSendMessage} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
