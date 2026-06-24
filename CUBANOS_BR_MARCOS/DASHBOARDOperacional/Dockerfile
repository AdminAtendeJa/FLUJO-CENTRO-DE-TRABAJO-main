# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .

# Pass Vite environment variables during build
ARG VITE_SUPABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ARG VITE_SUPABASE_SECRET_KEY
ENV VITE_SUPABASE_SECRET_KEY=$VITE_SUPABASE_SECRET_KEY
ARG VITE_GROQ_API_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ARG VITE_OPENROUTER_API_KEY
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY

RUN npm run build

# ── Stage 2: Serve with nginx ───────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
