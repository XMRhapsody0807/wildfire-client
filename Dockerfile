FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3001
ENV BACKEND_URL=http://aiim-backend:8080

EXPOSE 3001

CMD ["node", "index.js"]
