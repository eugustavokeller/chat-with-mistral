import React, { useState, KeyboardEvent, ChangeEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onCancel,
  isLoading,
}) => {
  const [message, setMessage] = useState("");

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage("");
      }
    }
  };

  return (
    <div className="relative p-4 border-t border-gray-700 bg-gray-800/50">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading ? "Gerando resposta..." : "Digite sua mensagem..."
          }
          className="flex-1 p-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-200"
          rows={1}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
          >
            <span>Cancelar</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (message.trim()) {
                onSendMessage(message);
                setMessage("");
              }
            }}
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Enviar</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
