# nodejs image for xml editor
FROM node:22.7.0-alpine3.20 AS builder

WORKDIR /app
COPY server.js /app/server.js
COPY package*.json /app/
COPY src /app/src
COPY index.html /app/index.html
COPY eslint.config.js /app/eslint.config.js
COPY vite.config.js /app/vite.config.js

RUN npm install
RUN npm run build

FROM node:22.7.0-alpine3.20
WORKDIR /app

COPY package*.json /app/

RUN npm ci --only=production

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server.js /app/server.js

CMD ["node", "server.js"]
 
