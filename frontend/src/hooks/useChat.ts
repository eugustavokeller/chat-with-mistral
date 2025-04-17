import { useReducer, useEffect } from "react";
import { Message, ChatState } from "../types/chat";

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
  | { type: "CLEAR_CHAT" };

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
    default:
      return state;
  }
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  let abortController: AbortController | null = null;

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

      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
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

  const clearChat = () => {
    dispatch({ type: "CLEAR_CHAT" });
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  return {
    state,
    sendMessage,
    clearChat,
    cancelRequest,
  };
};
