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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        <div
          className={`text-xs mt-2 ${
            isUser ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {format(timestamp, "HH:mm")}
        </div>
      </div>
    </div>
  );
};

export default Message;
