FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./

# Install dependencies (if any)
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
