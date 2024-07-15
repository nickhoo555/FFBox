# 使用 Debian 作为基础镜像
FROM linuxserver/ffmpeg

# 安装 Nginx 和其他必要的包
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY docker/be/service /app
RUN chmod +x /app/service

# 复制 Nginx 配置文件
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/fe /var/www/html

# 暴露端口
EXPOSE 80 33269

# 启动命令
CMD service nginx start && /app/service