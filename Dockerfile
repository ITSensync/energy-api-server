FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3008
EXPOSE 8080
CMD ["npm", "start"]
