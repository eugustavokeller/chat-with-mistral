import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Message: React.FC<MessageProps> = ({ role, content, timestamp }) => {
  const isUser = role === "user";
  const formattedTime = format(timestamp, "HH:mm");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">
            {isUser ? "Você" : "Assistente"}
          </span>
          <span className="text-xs opacity-75">{formattedTime}</span>
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default Message;
