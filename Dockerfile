FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
RUN yarn install

COPY . .

EXPOSE 8000

CMD ["yarn", "dev"]