FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY app ./app

EXPOSE 8001
EXPOSE 8002
CMD ["node", "app/index.js"]
