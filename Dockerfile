# Stage 1: Build React client
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Set up server
FROM node:18
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server files
COPY server ./server

# Copy client build into server/public
COPY --from=client-build /app/client/build ./server/public

WORKDIR /app/server
ENV PORT=5000
EXPOSE 5000
CMD ["node", "index.js"]
