FROM oven/bun:1.1-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and bun.lockb first (better caching)
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy rest of the code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite with Bun in dev mode
CMD ["bun", "run", "dev", "--", "--host"]
