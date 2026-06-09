FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* .npmrc ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
