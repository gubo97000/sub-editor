# # SPDX-FileCopyrightText: 2023 The Aalto Grades Developers
# #
# # SPDX-License-Identifier: MIT

# # Build stage
# FROM node:22-alpine AS build

# WORKDIR /app
# COPY package*.json ./
# RUN npm ci


# # Build
# RUN npm run build

# # Run stage
# FROM nginx:1.27-alpine AS run

# COPY --from=build /app/client/build /user/share/nginx/html
# COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

FROM node:23-alpine

ENV NODE_ENV development

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm i

COPY . .

ENV NODE_ENV production

RUN pnpm run build

FROM node:18.9-slim

WORKDIR /app

COPY --from=0 /app .

COPY . .

EXPOSE 3000

CMD ["node", "./build"]