import React, { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import Message from "./components/Message";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Add type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_URL: string;
    };
  }
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 15)
  );
  const { user, logout } = useAuth();

  useEffect(() => {
    // Load chat history from MongoDB
    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to load chat history");
        const data = await response.json();
        setMessages(
          data.map((msg: any) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };

    loadChatHistory();
  }, [sessionId]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message
      await fetch(`${import.meta.env.VITE_API_URL}/api/chat/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          role: "user",
          content: message,
        }),
      });

      // Send message to Ollama
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ollama/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: message,
            sessionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      // Save assistant message
      await fetch(`${import.meta.env.VITE_API_URL}/api/chat/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          role: "assistant",
          content: data.response,
        }),
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Chat com Ollama
            </h1>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-300">
                    {user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
            <div className="space-y-4">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
