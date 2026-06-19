ROM node:24-alpine

ENV MONGODB_URI="mongodb://genshin:columbinasandrone@genshin-db:27017/genshin-leaks?authSource=admin"
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN corepack enable && \
    apk add --no-cache \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3000

RUN pnpm run build

CMD ["node", ".output/server/index.mjs"]