# Use Node.js (LTS)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy dependency files first (for better caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the project
COPY . .

# Build the Next.js app
RUN pnpm run build

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]