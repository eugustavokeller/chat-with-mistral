FROM node:20

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY vite.config.js ./
COPY index.html ./

# Install dependencies
RUN npm install

# Copy source files
COPY ./src ./src
COPY ./public ./public

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
