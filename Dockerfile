FROM python:3.11-slim

WORKDIR /app

# Install Node.js for Playwright cookie refresh
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

RUN pip install --no-cache-dir fastapi uvicorn httpx aiohttp aiofiles twitter-api-client tqdm

EXPOSE 8888

CMD ["python3", "server.py"]
