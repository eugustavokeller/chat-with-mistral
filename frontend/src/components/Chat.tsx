import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Send, Bot, User, Loader2, Plus, LogOut, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent } from "./ui/sheet";
import { useToast } from "../hooks/use-toast";
import { useMobile } from "../hooks/use-mobile";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  preview: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string>("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
        content: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          sessionId: selectedChat,
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
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Failed to logout:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setSelectedChat(`chat-${Date.now()}`);
    toast({
      title: "New chat created",
      description: "You have started a new conversation",
    });
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 z-50 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="w-80 border-r bg-white dark:bg-gray-950 dark:border-gray-800">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Chat LLM</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={createNewChat}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar>
                <AvatarFallback>
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar for mobile */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent className="p-0 w-[300px]">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Chat LLM</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={createNewChat}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar>
                  <AvatarFallback>
                    {user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.username}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Chat LLM</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-4">
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
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar>
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Card
                      className={`max-w-[80%] p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </Card>
                    {message.role === "user" && (
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </main>

        <footer className="border-t bg-white dark:bg-gray-950 dark:border-gray-800 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
