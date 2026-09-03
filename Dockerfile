#############################
#     设置公共的变量         #
#############################
ARG BASE_IMAGE_TAG=resolute
FROM ubuntu:${BASE_IMAGE_TAG}

# 作者描述信息
LABEL org.opencontainers.image.authors="danxiaonuo" \
      org.opencontainers.image.vendor="danxiaonuo"
      
# 时区设置
ARG TZ=Asia/Shanghai
ENV TZ=$TZ
# 语言设置
ARG LANG=zh_CN.UTF-8
ENV LANG=$LANG

# 镜像变量
ARG DOCKER_IMAGE=danxiaonuo/ubuntu
ENV DOCKER_IMAGE=$DOCKER_IMAGE
ARG DOCKER_IMAGE_OS=ubuntu
ENV DOCKER_IMAGE_OS=$DOCKER_IMAGE_OS
ARG DOCKER_IMAGE_TAG=resolute
ENV DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG

# 环境设置
ARG DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_FRONTEND=$DEBIAN_FRONTEND

# GO环境变量
ARG GO_VERSION=1.26.0
ENV GO_VERSION=$GO_VERSION
ARG GOROOT=/opt/go
ENV GOROOT=$GOROOT
ARG GOPATH=/opt/golang
ENV GOPATH=$GOPATH

ARG PKG_DEPS="\
    zsh \
    bash \
    bash-doc \
    bash-completion \
    conntrack \
    ipset \
    ipvsadm \
    bind9-dnsutils \
    iproute2 \
    net-tools \
    iptables \
    nftables \
    bridge-utils \
    openvswitch-switch \
    libseccomp2 \
    nfs-common \
    rsync \
    socat \
    psmisc \
    procps \
    sysstat \
    firewalld \
    chrony \
    ntpsec-ntpdate \
    tcpdump \
    telnet \
    lsof \
    iftop \
    htop \
    nmap \
    nmap-common \
    jq \
    curl \
    wget \
    axel \
    git \
    vim \
    tree \
    unzip \
    zip \
    tar \
    subversion \
    lrzsz \
    gcc \
    g++ \
    build-essential \
    binutils \
    autoconf \
    automake \
    libtool \
    gettext \
    autopoint \
    asciidoc \
    gawk \
    patch \
    flex \
    texinfo \
    device-tree-compiler \
    zlib1g-dev \
    libjpeg-dev \
    libelf-dev \
    libssl-dev \
    openssl \
    libffi-dev \
    libglib2.0-dev \
    xmlto \
    libncurses-dev \
    locate \
    lvm2 \
    rsyslog \
    ca-certificates \
    gnupg2 \
    debsums \
    locales \
    tzdata \
    fonts-droid-fallback \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    fonts-arphic-ukai \
    fonts-arphic-uming \
    language-pack-zh-hans \
    numactl \
    xz-utils \
    libaio-dev \
    python3 \
    python3-dev \
    python3-pip \
    python3-yaml \
    python3-venv \
    python-is-python3 \
    tini \
    sshpass \
    iputils-ping \
    ncat \
    upx-ucl \
    libxml2-dev \
    libxslt1-dev \
    cargo \
    rustc \
    sudo \
    npm \
    uglifyjs"
ENV PKG_DEPS=$PKG_DEPS

# ***** 安装依赖 *****
RUN set -eux && \
   # 更新源地址
   sed -i s@http://*.*ubuntu.com@https://mirrors.aliyun.com@g /etc/apt/sources.list && \
   sed -i 's?# deb-src?deb-src?g' /etc/apt/sources.list && \
   # 解决证书认证失败问题
   touch /etc/apt/apt.conf.d/99verify-peer.conf && echo >>/etc/apt/apt.conf.d/99verify-peer.conf "Acquire { https::Verify-Peer false }" && \
   # 更新系统软件
   DEBIAN_FRONTEND=noninteractive apt update -qqy && apt upgrade -qqy && \
   # 安装依赖包(移除 --no-install-recommends 确保推荐依赖也被安装)
   DEBIAN_FRONTEND=noninteractive apt install -qqy $PKG_DEPS --option=Dpkg::Options::=--force-confdef && \
   DEBIAN_FRONTEND=noninteractive apt -qqy autoremove --purge && \
   DEBIAN_FRONTEND=noninteractive apt -qqy autoclean && \
   rm -rf /var/lib/apt/lists/* && \
   # 更新时区
   ln -sf /usr/share/zoneinfo/${TZ} /etc/localtime && \
   # 更新时间
   echo ${TZ} > /etc/timezone && \
    # 更改为zsh
    sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" || true && \
    sed -i -e "s/bin\/ash/bin\/zsh/" /etc/passwd && \
    sed -i -e 's/mouse=/mouse-=/g' /usr/share/vim/vim*/defaults.vim 2>/dev/null || true && \
    locale-gen zh_CN.UTF-8 && localedef -f UTF-8 -i zh_CN zh_CN.UTF-8 && locale-gen

# ***** 安装 Node.js 最新 LTS（每次构建时安装当前最新版本）*****
# 使用 n 在构建时获取最新 LTS；若需最新 Current 可改为 n latest
RUN set -eux && \
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
   DEBIAN_FRONTEND=noninteractive apt update -qqy && \
   DEBIAN_FRONTEND=noninteractive apt install -qqy nodejs && \
   npm config set registry https://registry.npmmirror.com && \
   npm install -g n && \
   n lts && \
   npm install -g wrangler && \
   rm -rf /var/lib/apt/lists/* /tmp/*

# ***** 升级 python3 版本 *****
RUN set -eux && \
    python3 -m pip config set global.break-system-packages true && \
    pip3 config set global.index-url http://mirrors.aliyun.com/pypi/simple/ && \
    pip3 config set install.trusted-host mirrors.aliyun.com && \
    python3 -m pip install --no-cache-dir --ignore-installed --upgrade setuptools wheel cython && \
    python3 -m pip install --no-cache-dir pycryptodome lxml cython beautifulsoup4 requests && \
    rm -rf /tmp/* /var/lib/apt/lists/*

# ***** 安装golang *****
RUN set -eux && \
    wget --no-check-certificate https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz -O /tmp/go${GO_VERSION}.linux-amd64.tar.gz && \
    cd /tmp/ && tar zxvf go${GO_VERSION}.linux-amd64.tar.gz -C /opt && \
    export GOROOT=/opt/go && \
    export GOPATH=/opt/golang && \
    export PATH=$PATH:$GOROOT/bin:$GOPATH/bin && \
    mkdir -pv $GOPATH/bin && rm -rf /tmp/* /var/lib/apt/lists/* && \
    ln -sf /opt/go/bin/* /usr/bin/


# 容器内默认工作目录（挂载项目后直接运行 Worker）
WORKDIR /app

# Worker 监听地址与端口（可通过环境变量覆盖）
ARG WRANGLER_IP=0.0.0.0
ARG WRANGLER_PORT=8787
ENV WRANGLER_IP=$WRANGLER_IP
ENV WRANGLER_PORT=$WRANGLER_PORT

EXPOSE ${WRANGLER_PORT}

# 默认 shell,方便 docker-compose command 使用
CMD ["/bin/zsh"]
