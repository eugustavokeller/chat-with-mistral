import { useChat } from "./hooks/useChat";
import Message from "./components/Message";
import ChatInput from "./components/ChatInput";

function App() {
  const { state, sendMessage, clearChat, cancelRequest } = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                💬 Chat com Mistral
              </h1>
              <p className="text-gray-400 mt-2">
                Converse com a IA de forma natural e intuitiva
              </p>
            </div>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200"
            >
              Limpar Chat
            </button>
          </div>
        </header>

        <main className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 min-h-[400px] max-h-[600px] overflow-y-auto shadow-xl">
            {state.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Nenhuma mensagem ainda. Comece uma conversa!</p>
              </div>
            ) : (
              state.messages.map((message) => (
                <Message key={message.id} message={message} />
              ))
            )}
          </div>

          {state.error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-400">{state.error}</p>
            </div>
          )}

          <ChatInput
            onSendMessage={sendMessage}
            onCancel={cancelRequest}
            isLoading={state.isLoading}
          />
        </main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Powered by Ollama & Mistral</p>
          <p>
            <a
              href="https://github.com/eugustavokeller/chat-with-mistral"
              className="hover:text-gray-300 transition-colors"
            >
              Código Fonte
            </a>
          </p>
          <p className="mt-2">
            © 2025 Gustavo Keller. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
