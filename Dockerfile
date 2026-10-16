#############################
#     精简单阶段构建         #
#############################
FROM iflyelf/ubuntu:lite

# 作者描述信息
LABEL org.opencontainers.image.authors="iflyelf" \
      org.opencontainers.image.vendor="iflyelf" \
      org.opencontainers.image.description="Cloudflare Workers 多功能加速代理 - 支持 GitHub、Docker、Git Clone、DoH 等" \
      org.opencontainers.image.source="https://github.com/iflyelf/workers-docker"

# 时区设置
ARG TZ=Asia/Shanghai
ENV TZ=$TZ

# 语言设置
ARG LANG=zh_CN.UTF-8
ENV LANG=$LANG

# 镜像变量
ARG DOCKER_IMAGE=iflyelf/ubuntu
ENV DOCKER_IMAGE=$DOCKER_IMAGE
ARG DOCKER_IMAGE_OS=ubuntu
ENV DOCKER_IMAGE_OS=$DOCKER_IMAGE_OS
ARG DOCKER_IMAGE_TAG=lite
ENV DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG

# 环境设置
ARG DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_FRONTEND=$DEBIAN_FRONTEND

# Worker 监听地址与端口
ARG WRANGLER_IP=0.0.0.0
ARG WRANGLER_PORT=8787
ENV WRANGLER_IP=$WRANGLER_IP
ENV WRANGLER_PORT=$WRANGLER_PORT

# Node.js 环境变量
ENV NODE_ENV=production
ENV PATH=/usr/local/bin:/usr/local/node/bin:$PATH

# 运行时依赖包（包含 Node.js 安装所需）
ARG RUNTIME_DEPS="\
    curl \
    wget \
    ca-certificates \
    tzdata \
    locales \
    procps \
    net-tools \
    iproute2 \
    iptables \
    nftables \
    jq \
    tini \
    gnupg2"
ENV RUNTIME_DEPS=$RUNTIME_DEPS

# ***** 安装运行时依赖和 Node.js *****
RUN set -eux && \
    # 更新源地址
    sed -i s@http://*.*ubuntu.com@https://mirrors.aliyun.com@g /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || \
    sed -i s@http://*.*ubuntu.com@https://mirrors.aliyun.com@g /etc/apt/sources.list && \
    # 解决证书认证失败问题
    mkdir -p /etc/apt/apt.conf.d && \
    echo 'Acquire { https::Verify-Peer false }' > /etc/apt/apt.conf.d/99verify-peer.conf && \
    # 更新系统
    DEBIAN_FRONTEND=noninteractive apt update -qqy && \
    # 安装运行时依赖
    DEBIAN_FRONTEND=noninteractive apt install -qqy --no-install-recommends $RUNTIME_DEPS && \
    # 安装 Node.js 22.x LTS
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    DEBIAN_FRONTEND=noninteractive apt update -qqy && \
    DEBIAN_FRONTEND=noninteractive apt install -qqy nodejs && \
    # 配置 npm 镜像源
    npm config set registry https://registry.npmmirror.com && \
    # 安装 wrangler
    npm install -g wrangler && \
    # 清理
    DEBIAN_FRONTEND=noninteractive apt -qqy autoremove --purge && \
    DEBIAN_FRONTEND=noninteractive apt -qqy autoclean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.npm && \
    # 配置时区
    ln -sf /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo ${TZ} > /etc/timezone && \
    # 配置语言环境
    locale-gen zh_CN.UTF-8 && \
    localedef -f UTF-8 -i zh_CN zh_CN.UTF-8

# 验证安装
RUN node --version && npm --version && wrangler --version

# 容器内默认工作目录
WORKDIR /app

# 复制 workers.js 到镜像（可通过挂载覆盖）
COPY workers.js /app/workers.js
COPY wrangler.toml /app/wrangler.toml

# 暴露端口
EXPOSE ${WRANGLER_PORT}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${WRANGLER_PORT}/ || exit 1

# 使用 tini 作为 init 进程
ENTRYPOINT ["/usr/bin/tini", "--"]

# 默认启动命令
CMD ["wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787", "--local"]
