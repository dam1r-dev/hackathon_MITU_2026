FROM node:22-slim
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend .
ENV API_TARGET=http://backend:8000
EXPOSE 3000
CMD ["npm", "run", "dev"]
