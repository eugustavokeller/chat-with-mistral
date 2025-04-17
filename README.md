# 💬 Chat com Mistral

Um aplicativo de chat moderno e intuitivo que utiliza o modelo Mistral através do Ollama para gerar respostas em tempo real.

![Chat com Mistral](https://i.imgur.com/placeholder.png)

## ✨ Características

- Interface moderna e responsiva
- Tema escuro com gradientes e efeitos de vidro
- Streaming de respostas em tempo real
- Capacidade de cancelar requisições em andamento
- Histórico de conversas persistente
- Design intuitivo e amigável

## 🚀 Tecnologias Utilizadas

- **Frontend:**

  - React + TypeScript
  - Vite
  - Tailwind CSS
  - date-fns

- **Backend:**
  - Node.js
  - Express
  - Ollama API

## 🛠️ Pré-requisitos

- Node.js (v18 ou superior)
- Docker e Docker Compose
- Ollama instalado e rodando localmente

## 📦 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/eugustavokeller/chat-with-mistral.git
cd chat-with-mistral
```

2. Inicie o Ollama (se ainda não estiver rodando):

```bash
ollama serve
```

3. Inicie os containers com Docker Compose:

```bash
docker compose up -d
```

4. Acesse o aplicativo em:

```
http://localhost:3000
```

## 🏗️ Estrutura do Projeto

```
.
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Hooks personalizados
│   │   └── types/         # Definições de tipos TypeScript
│   └── ...
├── backend/               # Servidor Express
│   ├── index.js          # Ponto de entrada do servidor
│   └── ...
└── docker-compose.yml    # Configuração do Docker
```

## 🎨 Interface

O aplicativo possui uma interface moderna com:

- Design responsivo que se adapta a diferentes tamanhos de tela
- Tema escuro com gradientes e efeitos de vidro
- Indicadores visuais de status (carregando, erro)
- Botão de cancelamento para requisições em andamento
- Histórico de conversas persistente

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

- **Gustavo Keller**
  - GitHub: [@eugustavokeller](https://github.com/eugustavokeller)
  - LinkedIn: [Gustavo Keller](https://www.linkedin.com/in/gustavo-keller-59124097)

## 🙏 Agradecimentos

- [Ollama](https://ollama.ai/) por fornecer a infraestrutura para rodar modelos de IA localmente
- [Mistral](https://mistral.ai/) pelo modelo de linguagem
- Comunidade open source por todas as bibliotecas e ferramentas utilizadas

---

© 2025 Gustavo Keller. Todos os direitos reservados.
