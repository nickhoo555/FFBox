# Dockerfile
FROM nginx:alpine

# 设置工作目录
# WORKDIR /app
RUN mkdir /app
# 复制后端文件
COPY docker/be/service /app/service
RUN chmod +x /app/service

# 复制Nginx配置文件
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/fe /usr/share/nginx/html

# 暴露端口
EXPOSE 80 33269

# 启动命令
CMD nginx && /app/service