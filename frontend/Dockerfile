# 多阶段构建 Dockerfile for React + Vite 前端项目

# 第一阶段：构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：生产阶段
FROM caddy:2-alpine AS production

# 安装必要的工具
RUN apk add --no-cache curl

# 复制自定义 Caddy 配置
COPY Caddyfile /etc/caddy/Caddyfile

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /srv

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置正确的权限
RUN chown -R nextjs:nodejs /srv && \
    chown -R nextjs:nodejs /data && \
    chown -R nextjs:nodejs /config

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动 Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
