FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_TITLE=DoQ
ARG VITE_API_BASE=/api
ARG VITE_VOLC_APPID=
ARG VITE_VOLC_ACCESS_KEY=

ENV VITE_TITLE=$VITE_TITLE
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_VOLC_APPID=$VITE_VOLC_APPID
ENV VITE_VOLC_ACCESS_KEY=$VITE_VOLC_ACCESS_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
