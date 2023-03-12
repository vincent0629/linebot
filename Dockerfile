FROM node:19.3-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY src src/
RUN npm install

EXPOSE 8080
CMD ["npm", "run", "start", "--", "-p", "8080"]
