import React from "react";
import { format } from "date-fns";
import { Message as MessageType } from "../types/chat";

interface MessageProps {
  message: MessageType;
  key?: string;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl p-4 ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-gray-700/50 text-gray-200 rounded-tl-none"
        } shadow-lg`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-2 h-2 rounded-full ${
              isUser ? "bg-blue-400" : "bg-green-400"
            }`}
          />
          <span className="text-xs font-medium opacity-80">
            {isUser ? "Você" : "Mistral"}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <p className="text-xs mt-2 opacity-60 text-right">
          {format(new Date(message.timestamp), "HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default Message;
