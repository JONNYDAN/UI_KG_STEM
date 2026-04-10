FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_API_BASE_URL=${VITE_API_URL}
ARG VITE_OIDC_ISSUER=http://localhost:8001
ARG VITE_OIDC_CLIENT_ID=eds-fe
ARG VITE_OIDC_REDIRECT_URI=http://localhost:3039/auth/callback
ARG VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3039
ARG VITE_OIDC_SCOPE="openid profile email"
ARG VITE_SKIP_CHECKER=true
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_OIDC_ISSUER=${VITE_OIDC_ISSUER}
ENV VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID}
ENV VITE_OIDC_REDIRECT_URI=${VITE_OIDC_REDIRECT_URI}
ENV VITE_OIDC_POST_LOGOUT_REDIRECT_URI=${VITE_OIDC_POST_LOGOUT_REDIRECT_URI}
ENV VITE_OIDC_SCOPE=${VITE_OIDC_SCOPE}
ENV VITE_SKIP_CHECKER=${VITE_SKIP_CHECKER}

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
