FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.mjs google-auth.mjs ./
COPY public ./public
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
EXPOSE 3000
CMD ["node","server.mjs"]
