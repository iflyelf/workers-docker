#############################
#     分阶段构建配置         #
#############################

#===========================================
# 构建阶段：使用完整工具链镜像
#===========================================
FROM iflyelf/ubuntu:latest AS builder

# 作者描述信息
LABEL org.opencontainers.image.authors="iflyelf" \
      org.opencontainers.image.vendor="iflyelf"

# 时区设置
ARG TZ=Asia/Shanghai
ENV TZ=$TZ

# 语言设置
ARG LANG=zh_CN.UTF-8
ENV LANG=$LANG

# 环境设置
ARG DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_FRONTEND=$DEBIAN_FRONTEND

WORKDIR /build

# iflyelf/ubuntu:latest 已预装 Node.js, Go, Python 等工具链
# 仅需安装 wrangler
RUN set -eux && \
    npm config set registry https://registry.npmmirror.com && \
    npm install -g wrangler && \
    rm -rf /tmp/* /root/.npm

# 验证安装
RUN node --version && npm --version && wrangler --version

#===========================================
# 运行阶段：使用精简镜像
#===========================================
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

# 运行时必需依赖包
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
    tini"
ENV RUNTIME_DEPS=$RUNTIME_DEPS

# ***** 安装运行时依赖 *****
RUN set -eux && \
    # 更新源地址
    sed -i s@http://*.*ubuntu.com@https://mirrors.aliyun.com@g /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || \
    sed -i s@http://*.*ubuntu.com@https://mirrors.aliyun.com@g /etc/apt/sources.list && \
    # 解决证书认证失败问题
    mkdir -p /etc/apt/apt.conf.d && \
    echo 'Acquire { https::Verify-Peer false }' > /etc/apt/apt.conf.d/99verify-peer.conf && \
    # 更新并安装运行时依赖
    DEBIAN_FRONTEND=noninteractive apt update -qqy && \
    DEBIAN_FRONTEND=noninteractive apt install -qqy --no-install-recommends $RUNTIME_DEPS && \
    # 清理
    DEBIAN_FRONTEND=noninteractive apt -qqy autoremove --purge && \
    DEBIAN_FRONTEND=noninteractive apt -qqy autoclean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    # 配置时区
    ln -sf /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo ${TZ} > /etc/timezone && \
    # 配置语言环境
    locale-gen zh_CN.UTF-8 && \
    localedef -f UTF-8 -i zh_CN zh_CN.UTF-8

# ***** 从构建阶段复制 Node.js 和 wrangler *****
# 复制 Node.js 二进制文件
COPY --from=builder /usr/bin/node /usr/local/bin/node
COPY --from=builder /usr/bin/npm /usr/local/bin/npm
COPY --from=builder /usr/bin/npx /usr/local/bin/npx

# 复制 wrangler
COPY --from=builder /usr/local/lib/node_modules/wrangler /usr/local/lib/node_modules/wrangler

# 创建 wrangler 可执行文件链接
RUN ln -sf /usr/local/lib/node_modules/wrangler/bin/wrangler.js /usr/local/bin/wrangler && \
    chmod +x /usr/local/bin/wrangler

# 创建符号链接
RUN set -eux && \
    ln -sf /usr/local/bin/node /usr/bin/node && \
    ln -sf /usr/local/bin/npm /usr/bin/npm && \
    ln -sf /usr/local/bin/npx /usr/bin/npx && \
    ln -sf /usr/local/bin/wrangler /usr/bin/wrangler

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
