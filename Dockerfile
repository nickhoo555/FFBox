# 使用 Debian 作为基础镜像
FROM debian:bullseye-slim

# 安装 Nginx、FFmpeg 和其他必要的包
RUN apt-get update && \
    apt-get install -y nginx ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY docker/be/service /app
RUN chmod +x /app/service

# 复制前端文件到 Nginx 默认的静态文件目录
COPY docker/fe /usr/share/nginx/html

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/

# 删除默认的 Nginx 默认站点配置
RUN rm /etc/nginx/sites-enabled/default

# 暴露端口
EXPOSE 80 33269

# 启动命令
CMD service nginx start && /app/service