# workers-docker

基于 Cloudflare Workers 的多功能加速代理，支持 GitHub、Docker、SourceForge、Google Sheets 等资源加速。

## 特性

- ✅ 基于 Ubuntu 24.04 + Node.js LTS + wrangler
- ✅ 内置多功能加速代理 Worker (proxy-cf)
- ✅ 支持 GitHub Raw/Release 文件加速
- ✅ 支持 Docker Hub 镜像加速
- ✅ 支持 Git Clone 加速
- ✅ 支持 Google Sheets 访问
- ✅ 支持 DNS-over-HTTPS (DoH) 服务
- ✅ 内置 nftables + gost 透明代理支持（解决国内网络访问问题）
- ✅ 通过挂载卷运行自定义 workers.js

## 镜像仓库

### Docker Hub
```bash
docker pull iflyelf/workers:latest
```

### 华为云 SWR（国内加速）
```bash
docker pull swr.cn-east-3.myhuaweicloud.com/iflyelf/workers:latest
```

## 快速开始

### 1. 准备项目文件

在宿主机创建项目目录，放置你的 `workers.js` 和 `wrangler.toml`：

```bash
mkdir my-worker && cd my-worker
# 创建 workers.js
cat > workers.js << 'EOF'
export default {
  async fetch(request, env) {
    return new Response('Hello from Workers!', {
      headers: { 'content-type': 'text/plain' }
    });
  }
};
EOF

# 创建 wrangler.toml
cat > wrangler.toml << 'EOF'
name = "my-worker"
main = "workers.js"
compatibility_date = "2026-01-01"
EOF

# 下载 docker-compose.yml
wget https://raw.githubusercontent.com/iflyelf/workers-docker/main/docker-compose.yml
```

### 2. 修改 docker-compose.yml 挂载路径

编辑 `docker-compose.yml`，确认卷挂载路径：

```yaml
volumes:
  # 挂载当前目录的 workers.js 和 wrangler.toml
  - ./workers.js:/app/workers.js:ro
  - ./wrangler.toml:/app/wrangler.toml:ro
```

### 3. 启动服务

```bash
docker compose up -d
```

访问 `http://localhost:8787` 即可看到 Worker 响应。

### 4. 查看日志

```bash
docker compose logs -f workers
```

## 透明代理配置

如果宿主机有 clash 代理（监听 `0.0.0.0:7890` 或 `172.20.0.1:7890`），容器内的 workerd 会自动通过 gost 透明代理访问外部服务（如 Cloudflare API）。

默认配置：
- **上游代理**: `http://172.20.0.1:7890`（宿主机 clash）
- **透明代理端口**: `12345`（gost 监听）
- **排除网段**: 私有网段和保留地址直连

如需修改代理地址，编辑 `docker-compose.yml` 中 gost 的 `-F=http://172.20.0.1:7890`。

## 热更新

修改 `workers.js` 后，wrangler dev 会自动检测并重新加载，无需重启容器。

## 常见问题

### 1. 容器启动失败，提示 nft 命令不存在

确保使用 `iflyelf/workers:latest` 镜像（已内置 nftables）。

### 2. 无法访问外部 API

检查宿主机 clash 是否监听在 `0.0.0.0:7890`，而非 `127.0.0.1:7890`（容器无法访问）。

### 3. 挂载的 workers.js 未生效

确认卷路径正确，可进入容器检查：

```bash
docker exec -it workers ls -l /app/
```

## 构建自定义镜像

如需自定义基础环境，修改 `Dockerfile` 后构建：

```bash
docker build -t myname/workers:latest .
```

## 内置 Worker 功能

本镜像内置 [proxy-cf](https://github.com/iflyelf/proxy-cf) Worker，提供以下功能：

- **GitHub 加速**: Release 下载、Raw 文件访问加速
- **Docker Hub 镜像加速**: 支持配置为 Docker registry mirror
- **其他容器仓库**: gcr.io, ghcr.io, quay.io, registry.k8s.io 等
- **Git Clone 加速**: 通过代理加速 Git 仓库克隆
- **Google Sheets 访问**: 无需 API Key 访问公开表格
- **DNS-over-HTTPS**: 提供 DoH 解析服务
- **SourceForge 加速**: 文件下载加速

访问 `http://localhost:8787` 可查看完整使用文档。

## 构建信息

- **GitHub Actions**: 自动构建并推送到 Docker Hub 和华为云 SWR
- **支持架构**: linux/amd64, linux/arm64
- **触发方式**: 
  - Push 修改 Dockerfile/workers.js/docker-compose.yml
  - 手动触发 workflow_dispatch
  - 定时构建（每天 UTC 21:00 / 北京时间 05:00）
  - Star 仓库触发

## 许可证

MIT
