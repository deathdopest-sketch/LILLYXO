# =============================================================================
# Lilly Bot — Docker image
# =============================================================================
FROM node:22-slim

# Install Chromium + Xvfb (virtual display for WebRTC / canvas capture)
RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    xauth \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libgbm1 \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# Tell puppeteer not to download bundled Chrome — we use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    BROWSER_PATH=/usr/bin/chromium \
    DISPLAY=:99 \
    DOCKER=true

WORKDIR /app

# Install deps first (layer cache friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 7002

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "--max-old-space-size=3072", "Lilly_Bot.js"]
