FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# prisma.config.ts requires DATABASE_URL to load; generate does not need a live DB.
# Runtime URL is set by docker-compose.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placeholder"
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]