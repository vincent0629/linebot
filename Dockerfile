FROM node:19.3-alpine
ARG line
ARG chatsonic

WORKDIR /app
COPY package.json package-lock.json ./
COPY src src/
RUN npm install

ENV LINE_ACCESS_TOKEN=$line
ENV CHATSONIC_API_KEY=$chatsonic

EXPOSE 8080
CMD ["npm", "run", "start", "--", "-p", "8080"]
