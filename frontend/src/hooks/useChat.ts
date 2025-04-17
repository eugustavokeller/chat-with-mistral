import { useReducer, useEffect } from "react";
import { Message, ChatState } from "../types/chat";
import { useAuth } from "../contexts/AuthContext";

const CHAT_STORAGE_KEY = "chat_messages";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_CHAT" }
  | { type: "SET_MESSAGES"; payload: Message[] };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "CLEAR_CHAT":
      return {
        ...state,
        messages: [],
        error: null,
      };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
        error: null,
      };
    default:
      return state;
  }
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { token } = useAuth();
  let abortController: AbortController | null = null;

  // Load chat history from MongoDB
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/chat/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }

        const messages = await response.json();
        dispatch({ type: "SET_MESSAGES", payload: messages });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    if (token) {
      loadHistory();
    }
  }, [token]);

  // Carregar mensagens do localStorage ao iniciar
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        messages.forEach((message: Message) => {
          dispatch({ type: "ADD_MESSAGE", payload: message });
        });
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      }
    }
  }, []);

  // Salvar mensagens no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.messages));
  }, [state.messages]);

  const sendMessage = async (content: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      abortController = new AbortController();

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      const response = await fetch("http://localhost:3001/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: "default", // You can implement multiple sessions later
          prompt: content,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        dispatch({ type: "SET_ERROR", payload: "Request cancelled" });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "An error occurred",
        });
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      abortController = null;
    }
  };

  const cancelRequest = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const clearChat = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/chat/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: "default",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear chat");
      }

      dispatch({ type: "CLEAR_CHAT" });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return {
    state,
    sendMessage,
    clearChat,
    cancelRequest,
  };
};
