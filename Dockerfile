FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./

RUN npm install

COPY tsconfig.json ./
COPY .eslintrc.cjs ./
COPY jest.config.ts ./
COPY src ./src
RUN npm run build
COPY frontend ./frontend
RUN npm install --prefix frontend
RUN npm run build --prefix frontend
RUN npm prune --omit=dev

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY db ./db
COPY --from=base /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
