// ============================================================================
// 多功能加速代理 - Cloudflare Workers
// 支持 GitHub、Docker、SourceForge、Google Sheets 等资源加速
// ============================================================================

const CONFIG = {
  domain: 'proxy.xiaonuo.live',
  
  // Docker 镜像仓库路径前缀映射
  dockerRegistries: {
    'docker.io': 'https://docker.1panel.live',
    'registry-1.docker.io': 'https://docker.1panel.live',
    'ghcr.io': 'https://ghcr.io',
    'gcr.io': 'https://gcr.io',
    'k8s.gcr.io': 'https://k8s.gcr.io',
    'registry.k8s.io': 'https://registry.k8s.io',
    'quay.io': 'https://quay.io',
    'mcr.microsoft.com': 'https://mcr.microsoft.com',
    'nvcr.io': 'https://nvcr.io',
    'public.ecr.aws': 'https://public.ecr.aws',
    'docker.cloudsmith.io': 'https://docker.cloudsmith.io',
  },
  
  // 默认 Docker Hub 上游
  defaultDockerUpstream: 'https://docker.1panel.live',
};

// CORS 预检请求配置
const PREFLIGHT_INIT = {
  headers: new Headers({
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
    'access-control-allow-headers': '*',
    'access-control-max-age': '86400',
  }),
};

// ============================================================================
// 工具函数
// ============================================================================

function makeRes(body, status = 200, headers = {}) {
  const responseHeaders = headers instanceof Headers ? headers : new Headers(headers);
  responseHeaders.set('access-control-allow-origin', '*');
  return new Response(body, { status, headers: responseHeaders });
}

// ============================================================================
// 主页 HTML
// ============================================================================

function generateHomePage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多功能加速代理 - ${CONFIG.domain}</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23c9a882;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23a08968;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='45' fill='url(%23grad)'/%3E%3Cpath d='M30 50 L45 35 L45 45 L70 45 L70 55 L45 55 L45 65 Z' fill='white'/%3E%3C/svg%3E">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        :root {
            /* 暖米色主题色 */
            --bg-primary: #f5f0e8;
            --bg-secondary: #faf7f2;
            --bg-card: rgba(255, 252, 247, 0.95);
            --color-primary: #c9a882;
            --color-secondary: #a08968;
            --color-text: #5a4a3a;
            --color-text-light: #8a7a6a;
            --border-color: rgba(201, 168, 130, 0.15);
            --shadow-light: 0 2px 16px rgba(90, 74, 58, 0.08);
            --shadow-medium: 0 8px 32px rgba(90, 74, 58, 0.12);
            --shadow-heavy: 0 16px 48px rgba(90, 74, 58, 0.15);
            --radius-sm: 12px;
            --radius-md: 16px;
            --radius-lg: 20px;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, #e8dcc8 100%);
            color: var(--color-text);
            line-height: 1.7;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            letter-spacing: -0.02em;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
        }
        
        header { 
            text-align: center; 
            padding: 48px 20px 40px; 
            color: var(--color-text);
        }
        
        h1 { 
            font-size: 2.75rem; 
            margin-bottom: 12px; 
            font-weight: 700;
            letter-spacing: -0.03em;
            color: var(--color-text);
        }
        
        .subtitle { 
            font-size: 1.125rem; 
            font-weight: 400;
            color: var(--color-text-light);
            letter-spacing: -0.01em;
        }
        
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        
        .service-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: 28px;
            box-shadow: var(--shadow-light);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            min-height: 280px; /* 确保卡片最小高度一致 */
        }
        
        .service-card:hover { 
            transform: translateY(-8px); 
            box-shadow: var(--shadow-heavy);
        }
        
        .service-card h2 { 
            color: var(--color-primary); 
            margin-bottom: 12px; 
            font-size: 1.375rem; 
            font-weight: 600;
            letter-spacing: -0.02em;
            min-height: 40px; /* 标题高度统一 */
            display: flex;
            align-items: center;
        }
        
        .service-card p { 
            color: var(--color-text-light); 
            margin-bottom: 16px; 
            font-size: 0.9375rem;
            line-height: 1.6;
            min-height: 48px; /* 描述高度统一 */
        }
        
        .service-card pre {
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: var(--radius-sm);
            overflow-x: auto;
            font-size: 0.8125rem;
            border: 1px solid var(--border-color);
            line-height: 1.7;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            color: var(--color-text);
            flex: 1; /* 让代码块填充剩余空间 */
            margin: 0;
        }
        
        .url-input-section {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: 32px;
            margin: 40px 0;
            box-shadow: var(--shadow-medium);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }
        
        .url-input-section h2 { 
            color: var(--color-primary); 
            margin-bottom: 18px; 
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        
        .url-input-section p {
            color: var(--color-text-light);
            margin-bottom: 20px;
            font-size: 0.9375rem;
        }
        
        .input-group { 
            display: flex; 
            gap: 12px; 
            margin-bottom: 16px; 
        }
        
        input[type="url"] {
            flex: 1;
            padding: 14px 18px;
            border: 1.5px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--bg-secondary);
            color: var(--color-text);
            font-family: inherit;
        }
        
        input[type="url"]::placeholder {
            color: var(--color-text-light);
            opacity: 0.6;
        }
        
        input[type="url"]:focus { 
            outline: none; 
            border-color: var(--color-primary); 
            box-shadow: 0 0 0 4px rgba(201, 168, 130, 0.1);
            background: #fff;
        }
        
        button {
            padding: 14px 32px;
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(201, 168, 130, 0.25);
            white-space: nowrap;
            letter-spacing: -0.01em;
        }
        
        button:hover { 
            background: var(--color-secondary);
            box-shadow: 0 6px 20px rgba(201, 168, 130, 0.35);
            transform: translateY(-2px);
        }
        
        button:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(201, 168, 130, 0.2);
        }
        
        .result {
            margin-top: 16px;
            padding: 18px;
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            word-break: break-all;
            display: none;
            border: 1px solid var(--border-color);
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .result.show { display: block; }
        
        .result a { 
            color: var(--color-primary); 
            text-decoration: none; 
            font-weight: 600;
            transition: color 0.3s;
        }
        
        .result a:hover { 
            color: var(--color-secondary);
            text-decoration: underline; 
        }
        
        footer { 
            text-align: center; 
            padding: 48px 20px 32px; 
            color: var(--color-text-light);
            margin-top: 60px;
            font-size: 0.9375rem;
        }
        
        footer a { 
            color: var(--color-primary); 
            text-decoration: none; 
            transition: all 0.3s;
            font-weight: 500;
        }
        
        footer a:hover {
            color: var(--color-secondary);
        }
        
        /* 帮助文档样式 */
        .help-section {
            margin: 60px 0 40px;
        }
        
        .help-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: 32px;
            box-shadow: var(--shadow-medium);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }
        
        .help-card > h2 {
            color: var(--color-primary);
            font-size: 1.75rem;
            margin-bottom: 32px;
            font-weight: 600;
            letter-spacing: -0.02em;
            text-align: center;
        }
        
        .help-item {
            margin-bottom: 36px;
            padding-bottom: 32px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .help-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .help-item h3 {
            color: var(--color-primary);
            font-size: 1.25rem;
            margin-bottom: 12px;
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        
        .help-item > p {
            color: var(--color-text-light);
            margin-bottom: 12px;
            font-size: 0.9375rem;
            line-height: 1.6;
        }
        
        .help-item pre {
            background: var(--bg-secondary);
            padding: 16px;
            border-radius: var(--radius-sm);
            overflow-x: auto;
            font-size: 0.875rem;
            border: 1px solid var(--border-color);
            line-height: 1.7;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            color: var(--color-text);
            margin-top: 12px;
            position: relative;
        }
        
        /* 代码块容器 */
        .code-block {
            position: relative;
            margin-top: 12px;
        }
        
        .code-block pre {
            margin: 0;
            padding-right: 60px; /* 为复制按钮留出空间 */
        }
        
        /* 复制按钮样式 */
        .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 6px 12px;
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            opacity: 0.9;
            box-shadow: none;
        }
        
        .copy-btn:hover {
            opacity: 1;
            background: var(--color-secondary);
            transform: none;
            box-shadow: 0 2px 8px rgba(201, 168, 130, 0.3);
        }
        
        .copy-btn:active {
            transform: scale(0.95);
        }
        
        .copy-btn.copied {
            background: #27ae60;
        }
        
        .copy-btn.copied::after {
            content: ' ✓';
        }
        
        .help-item ul {
            list-style: none;
            padding-left: 0;
        }
        
        .help-item ul li {
            padding: 8px 0 8px 28px;
            position: relative;
            color: var(--color-text-light);
            font-size: 0.9375rem;
            line-height: 1.6;
        }
        
        .help-item ul li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: var(--color-primary);
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .faq p {
            margin-bottom: 16px;
            line-height: 1.7;
        }
        
        .faq p strong {
            color: var(--color-primary);
            font-weight: 600;
        }
        
        .faq p:last-child {
            margin-bottom: 0;
        }
        
        /* 滚动条美化 (WebKit) */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--color-primary);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--color-secondary);
        }
        
        /* 移动端优化 */
        @media (max-width: 768px) {
            .container {
                padding: 12px;
            }
            
            header {
                padding: 32px 16px 24px;
            }
            
            h1 { 
                font-size: 2rem; 
            }
            
            .subtitle {
                font-size: 1rem;
            }
            
            .services {
                grid-template-columns: 1fr;
                gap: 16px;
                margin: 24px 0;
            }
            
            .service-card {
                padding: 20px;
                border-radius: var(--radius-md);
            }
            
            .service-card h2 {
                font-size: 1.25rem;
            }
            
            .service-card pre {
                font-size: 0.8125rem;
                padding: 12px;
            }
            
            .url-input-section {
                padding: 24px 20px;
                margin: 24px 0;
                border-radius: var(--radius-md);
            }
            
            .url-input-section h2 {
                font-size: 1.375rem;
            }
            
            .input-group { 
                flex-direction: column;
                gap: 12px;
            }
            
            input[type="url"] {
                padding: 14px 16px;
                font-size: 16px; /* 防止 iOS 自动缩放 */
            }
            
            button { 
                width: 100%;
                padding: 16px 20px;
            }
            
            .result {
                font-size: 0.9375rem;
                padding: 14px;
            }
            
            footer {
                padding: 40px 16px 24px;
                font-size: 0.875rem;
            }
            
            /* 帮助文档移动端优化 */
            .help-section {
                margin: 40px 0 20px;
            }
            
            .help-card {
                padding: 24px 20px;
                border-radius: var(--radius-md);
            }
            
            .help-card > h2 {
                font-size: 1.5rem;
                margin-bottom: 24px;
            }
            
            .help-item {
                margin-bottom: 28px;
                padding-bottom: 24px;
            }
            
            .help-item h3 {
                font-size: 1.125rem;
            }
            
            .help-item pre {
                font-size: 0.8125rem;
                padding: 12px;
            }
            
            .help-item ul li {
                font-size: 0.875rem;
                padding: 6px 0 6px 24px;
            }
        }
        
        /* 小屏幕设备 */
        @media (max-width: 480px) {
            h1 {
                font-size: 1.75rem;
            }
            
            .subtitle {
                font-size: 0.9375rem;
            }
            
            .service-card h2 {
                font-size: 1.125rem;
            }
            
            .service-card p {
                font-size: 0.875rem;
            }
            
            .service-card {
                padding: 18px;
            }
        }
        
        /* 平板设备 */
        @media (min-width: 768px) and (max-width: 1024px) {
            .services {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        /* 横屏优化 */
        @media (max-width: 896px) and (orientation: landscape) {
            header {
                padding: 24px 16px;
            }
            
            h1 {
                font-size: 1.75rem;
            }
            
            .services {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .service-card {
                padding: 20px;
            }
        }
        
        /* 触摸设备优化 */
        @media (hover: none) and (pointer: coarse) {
            button {
                min-height: 48px; /* iOS 推荐的最小触摸目标 */
                padding: 16px 32px;
            }
            
            input[type="url"] {
                min-height: 48px;
            }
            
            .service-card:hover {
                transform: none; /* 移动端禁用 hover 效果 */
            }
        }
        
        /* 高分辨率屏幕优化 */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
            body {
                -webkit-font-smoothing: subpixel-antialiased;
            }
        }
        
        /* 暗色模式支持（可选） */
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-primary: #2a2520;
                --bg-secondary: #3a342e;
                --bg-card: rgba(58, 52, 46, 0.95);
                --color-primary: #d4b896;
                --color-secondary: #c9a882;
                --color-text: #e8dcc8;
                --color-text-light: #b8aa98;
                --border-color: rgba(212, 184, 150, 0.15);
            }
            
            input[type="url"] {
                background: var(--bg-primary);
                color: var(--color-text);
            }
            
            input[type="url"]:focus {
                background: var(--bg-secondary);
            }
        }
        
        /* 返回顶部按钮 */
        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(201, 168, 130, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            opacity: 0;
        }
        
        .back-to-top.show {
            display: flex;
            opacity: 1;
        }
        
        .back-to-top:hover {
            background: var(--color-secondary);
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(201, 168, 130, 0.5);
        }
        
        .back-to-top:active {
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            .back-to-top {
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                font-size: 1.3rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 多功能加速代理</h1>
            <p class="subtitle">GitHub、Docker、SourceForge 等资源加速访问</p>
        </header>

        <div class="url-input-section">
            <h2>📥 直链下载加速</h2>
            <p>支持任何直链文件的加速下载</p>
            <div class="input-group">
                <input type="url" id="url" placeholder="请输入完整的 URL（支持 GitHub、SourceForge 等）">
                <button onclick="generateProxyUrl()">生成加速链接</button>
            </div>
            <div id="result" class="result"></div>
        </div>

        <div class="url-input-section" style="margin-top: 30px;">
            <h2>🔄 GitHub 克隆加速</h2>
            <p>生成 Git Clone 加速链接，无需配置直接使用</p>
            <div class="input-group">
                <input type="url" id="gitUrl" placeholder="请输入 GitHub 仓库地址（例如：https://github.com/user/repo.git）">
                <button onclick="generateGitCloneUrl()">生成克隆命令</button>
            </div>
            <div id="gitResult" class="result"></div>
        </div>

        <div class="services">
            <div class="service-card">
                <h2>🐙 GitHub 加速</h2>
                <p>加速访问 GitHub Raw 和 Release 文件</p>
                <pre>原地址：
https://github.com/junegunn/fzf/releases/download/v0.54.0/fzf-0.54.0-linux_amd64.tar.gz

加速地址：
https://${CONFIG.domain}/proxy?url=https://github.com/junegunn/fzf/releases/download/v0.54.0/fzf-0.54.0-linux_amd64.tar.gz

Raw 文件加速：
https://${CONFIG.domain}/proxy?url=https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md</pre>
            </div>

            <div class="service-card">
                <h2>🐳 Docker Hub 镜像加速</h2>
                <p>配置 Docker daemon 使用镜像加速</p>
                <pre># 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": ["https://${CONFIG.domain}"]
}

# 重启 Docker
sudo systemctl restart docker

# 拉取镜像
docker pull nginx:alpine</pre>
            </div>
            
            <div class="service-card">
                <h2>🔷 Containerd 配置</h2>
                <p>Kubernetes 和 Containerd 用户配置方法</p>
                <pre># 编辑 /etc/containerd/config.toml

# Containerd v1 配置
[plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
    endpoint = ["https://${CONFIG.domain}"]

# Containerd v2 配置
[plugins."io.containerd.cri.v1.images".registry]
  config_path = "/etc/containerd/certs.d"

# 然后创建镜像配置
mkdir -p /etc/containerd/certs.d/docker.io
cat > /etc/containerd/certs.d/docker.io/hosts.toml << EOF
server = "https://docker.io"
[host."https://${CONFIG.domain}"]
  capabilities = ["pull", "resolve"]
EOF

# 重启 Containerd
sudo systemctl restart containerd</pre>
            </div>

            <div class="service-card">
                <h2>📦 其他容器仓库</h2>
                <p>通过路径前缀访问其他容器注册表（单域名方案）</p>
                <pre># ✅ 公开镜像（无需认证）

# Google GCR
docker pull ${CONFIG.domain}/gcr.io/google-containers/pause:3.2

# Kubernetes
docker pull ${CONFIG.domain}/registry.k8s.io/pause:3.9
docker pull ${CONFIG.domain}/k8s.gcr.io/pause:3.5

# Quay.io
docker pull ${CONFIG.domain}/quay.io/prometheus/node-exporter:latest

# Microsoft MCR
docker pull ${CONFIG.domain}/mcr.microsoft.com/dotnet/runtime:7.0-alpine

# ⚠️ 需要认证的注册表
# ghcr.io, nvcr.io, public.ecr.aws, docker.cloudsmith.io
# 详见帮助文档</pre>
            </div>

            <div class="service-card">
                <h2>📊 Google Sheets 代理</h2>
                <p>访问 Google Sheets 数据（无需 API Key）</p>
                <pre>格式：
https://${CONFIG.domain}/sheet/YOUR_SHEET_ID

示例：
https://${CONFIG.domain}/sheet/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</pre>
            </div>

            <div class="service-card">
                <h2>⚙️ Git Clone 加速</h2>
                <p>配置 Git 使用代理加速克隆和拉取</p>
                <pre># 方式1：全局配置（推荐）
git config --global url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf "https://github.com/"

# 方式2：单次克隆（无需配置）
git clone https://${CONFIG.domain}/proxy?url=https://github.com/torvalds/linux.git

# 验证配置
git config --get-regexp url

# 测试克隆速度
git clone https://github.com/kubernetes/kubernetes.git

# 取消配置
git config --global --unset url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf</pre>
            </div>

            <div class="service-card">
                <h2>🔧 SourceForge 加速</h2>
                <p>加速 SourceForge 文件下载</p>
                <pre>原地址：
https://sourceforge.net/projects/project/files/file.zip

加速地址：
https://${CONFIG.domain}/proxy?url=https://sourceforge.net/projects/project/files/file.zip</pre>
            </div>
        </div>
        
        <div class="help-section">
            <div class="help-card">
                <h2>📚 使用帮助</h2>
                
                <div class="help-item">
                    <h3>🐳 Docker Hub 配置</h3>
                    <p>编辑 /etc/docker/daemon.json 文件：</p>
                    <pre>{
  "registry-mirrors": ["https://${CONFIG.domain}"]
}

# 保存后重启 Docker
sudo systemctl restart docker

# 然后正常拉取镜像
docker pull nginx:alpine
docker pull mysql:8.0</pre>
                </div>
                
                <div class="help-item">
                    <h3>🔷 Containerd 配置（Kubernetes 用户）</h3>
                    <p><strong>方法1：Containerd v1 配置</strong></p>
                    <pre># 编辑 /etc/containerd/config.toml
# 找到 [plugins."io.containerd.grpc.v1.cri".registry] 部分

[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
      endpoint = ["https://${CONFIG.domain}"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."gcr.io"]
      endpoint = ["https://${CONFIG.domain}/gcr.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."registry.k8s.io"]
      endpoint = ["https://${CONFIG.domain}/registry.k8s.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
      endpoint = ["https://${CONFIG.domain}/k8s.gcr.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."quay.io"]
      endpoint = ["https://${CONFIG.domain}/quay.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."ghcr.io"]
      endpoint = ["https://${CONFIG.domain}/ghcr.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."mcr.microsoft.com"]
      endpoint = ["https://${CONFIG.domain}/mcr.microsoft.com"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."nvcr.io"]
      endpoint = ["https://${CONFIG.domain}/nvcr.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."public.ecr.aws"]
      endpoint = ["https://${CONFIG.domain}/public.ecr.aws"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.cloudsmith.io"]
      endpoint = ["https://${CONFIG.domain}/docker.cloudsmith.io"]

# 重启 Containerd
sudo systemctl restart containerd</pre>
                    
                    <p><strong>方法2：Containerd v2 配置（推荐）</strong></p>
                    <pre># 1. 在 /etc/containerd/config.toml 中启用 certs.d 目录
[plugins."io.containerd.cri.v1.images".registry]
  config_path = "/etc/containerd/certs.d"

# 2. 为 Docker Hub 创建配置
sudo mkdir -p /etc/containerd/certs.d/docker.io
sudo tee /etc/containerd/certs.d/docker.io/hosts.toml << EOF
server = "https://docker.io"

[host."https://${CONFIG.domain}"]
  capabilities = ["pull", "resolve"]
  skip_verify = false
EOF

# 3. 为 GCR 创建配置
sudo mkdir -p /etc/containerd/certs.d/gcr.io
sudo tee /etc/containerd/certs.d/gcr.io/hosts.toml << EOF
server = "https://gcr.io"

[host."https://${CONFIG.domain}/gcr.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 4. 为 Kubernetes Registry 创建配置
sudo mkdir -p /etc/containerd/certs.d/registry.k8s.io
sudo tee /etc/containerd/certs.d/registry.k8s.io/hosts.toml << EOF
server = "https://registry.k8s.io"

[host."https://${CONFIG.domain}/registry.k8s.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 5. 为 Kubernetes 旧版创建配置
sudo mkdir -p /etc/containerd/certs.d/k8s.gcr.io
sudo tee /etc/containerd/certs.d/k8s.gcr.io/hosts.toml << EOF
server = "https://k8s.gcr.io"

[host."https://${CONFIG.domain}/k8s.gcr.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 6. 为 Quay.io 创建配置
sudo mkdir -p /etc/containerd/certs.d/quay.io
sudo tee /etc/containerd/certs.d/quay.io/hosts.toml << EOF
server = "https://quay.io"

[host."https://${CONFIG.domain}/quay.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 7. 为 GitHub Packages 创建配置
sudo mkdir -p /etc/containerd/certs.d/ghcr.io
sudo tee /etc/containerd/certs.d/ghcr.io/hosts.toml << EOF
server = "https://ghcr.io"

[host."https://${CONFIG.domain}/ghcr.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 8. 为 Microsoft MCR 创建配置
sudo mkdir -p /etc/containerd/certs.d/mcr.microsoft.com
sudo tee /etc/containerd/certs.d/mcr.microsoft.com/hosts.toml << EOF
server = "https://mcr.microsoft.com"

[host."https://${CONFIG.domain}/mcr.microsoft.com"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 9. 为 NVIDIA NGC 创建配置
sudo mkdir -p /etc/containerd/certs.d/nvcr.io
sudo tee /etc/containerd/certs.d/nvcr.io/hosts.toml << EOF
server = "https://nvcr.io"

[host."https://${CONFIG.domain}/nvcr.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 10. 为 AWS ECR Public 创建配置
sudo mkdir -p /etc/containerd/certs.d/public.ecr.aws
sudo tee /etc/containerd/certs.d/public.ecr.aws/hosts.toml << EOF
server = "https://public.ecr.aws"

[host."https://${CONFIG.domain}/public.ecr.aws"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 11. 为 Cloudsmith 创建配置
sudo mkdir -p /etc/containerd/certs.d/docker.cloudsmith.io
sudo tee /etc/containerd/certs.d/docker.cloudsmith.io/hosts.toml << EOF
server = "https://docker.cloudsmith.io"

[host."https://${CONFIG.domain}/docker.cloudsmith.io"]
  capabilities = ["pull", "resolve"]
  override_path = true
EOF

# 12. 重启 Containerd
sudo systemctl restart containerd

# 13. 测试（使用 crictl）
sudo crictl pull nginx:alpine
sudo crictl pull registry.k8s.io/pause:3.9</pre>
                    
                    <p><strong>配置说明</strong></p>
                    <ul>
                        <li><code>server</code> - 原始注册表地址</li>
                        <li><code>capabilities</code> - 支持的操作（pull, resolve, push）</li>
                        <li><code>override_path</code> - 保留完整路径（用于路径前缀代理）</li>
                        <li><code>skip_verify</code> - 是否跳过 TLS 验证（false 更安全）</li>
                    </ul>
                </div>
                
                <div class="help-item">
                    <h3>📦 其他容器仓库</h3>
                    <p><strong>✅ 公开镜像（无需认证）</strong></p>
                    <pre># Google GCR (gcr.io) - 公开镜像
docker pull ${CONFIG.domain}/gcr.io/google-containers/pause:3.2

# Kubernetes 官方镜像 (registry.k8s.io)
docker pull ${CONFIG.domain}/registry.k8s.io/coredns/coredns:v1.10.1
docker pull ${CONFIG.domain}/registry.k8s.io/pause:3.9

# Kubernetes 旧镜像 (k8s.gcr.io)
docker pull ${CONFIG.domain}/k8s.gcr.io/pause:3.5

# Quay.io - 公开镜像
docker pull ${CONFIG.domain}/quay.io/prometheus/node-exporter:latest
docker pull ${CONFIG.domain}/quay.io/coreos/etcd:v3.5.9

# Microsoft MCR - 公开镜像
docker pull ${CONFIG.domain}/mcr.microsoft.com/dotnet/runtime:7.0-alpine
docker pull ${CONFIG.domain}/mcr.microsoft.com/windows/nanoserver:ltsc2022</pre>
                    
                    <p><strong>⚠️ 需要认证的注册表</strong></p>
                    <pre># GitHub Packages (ghcr.io) - 需要 GitHub Token
# 创建 Personal Access Token: https://github.com/settings/tokens
# 需要 read:packages 权限
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
# 然后使用代理
docker pull ${CONFIG.domain}/ghcr.io/owner/repo:tag

# NVIDIA NGC (nvcr.io) - 需要 NVIDIA 账户
# 访问 https://ngc.nvidia.com/ 注册并获取 API Key
docker login nvcr.io
# 然后使用代理
docker pull ${CONFIG.domain}/nvcr.io/nvidia/cuda:11.8.0-base-ubuntu22.04

# AWS ECR Public (public.ecr.aws) - 需要 AWS 认证
# 配置 AWS CLI 后使用
docker pull ${CONFIG.domain}/public.ecr.aws/amazonlinux/amazonlinux:latest

# Cloudsmith (docker.cloudsmith.io) - 需要 Cloudsmith 账户
# 访问 https://cloudsmith.io/ 注册
docker pull ${CONFIG.domain}/docker.cloudsmith.io/org/repo/image:tag</pre>
                </div>
                
                <div class="help-item">
                    <h3>🐙 GitHub 文件加速</h3>
                    <p>在 GitHub URL 前添加代理地址：</p>
                    <pre># Raw 文件加速
原地址: https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md
加速后: https://${CONFIG.domain}/proxy?url=https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md

# Release 下载加速
原地址: https://github.com/junegunn/fzf/releases/download/v0.54.0/fzf-0.54.0-linux_amd64.tar.gz
加速后: https://${CONFIG.domain}/proxy?url=https://github.com/junegunn/fzf/releases/download/v0.54.0/fzf-0.54.0-linux_amd64.tar.gz

# 其他示例
https://${CONFIG.domain}/proxy?url=https://github.com/golang/go/archive/refs/tags/go1.21.0.tar.gz</pre>
                </div>
                
                <div class="help-item">
                    <h3>📥 通用文件下载</h3>
                    <p>支持任意 HTTP/HTTPS 文件加速：</p>
                    <pre># 方式1：/proxy?url= 格式（推荐）
https://${CONFIG.domain}/proxy?url=YOUR_FILE_URL

# 方式2：根路径参数
https://${CONFIG.domain}/?url=YOUR_FILE_URL

# SourceForge 示例
https://${CONFIG.domain}/proxy?url=https://sourceforge.net/projects/project/files/file.zip</pre>
                </div>
                
                <div class="help-item">
                    <h3>⚙️ Git Clone 加速详解</h3>
                    <p>配置 Git 使用代理进行 clone、pull、fetch 加速：</p>
                    <pre># 🔧 全局配置（推荐 - 所有仓库生效）
git config --global url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf "https://github.com/"

# ✅ 验证配置
git config --get-regexp url
# 输出：url.https://${CONFIG.domain}/proxy?url=https://github.com/.insteadof https://github.com/

# 🚀 测试克隆（配置后自动使用代理）
git clone https://github.com/kubernetes/kubernetes.git
git clone https://github.com/torvalds/linux.git

# 📦 单次克隆（不修改全局配置）
git clone https://${CONFIG.domain}/proxy?url=https://github.com/USERNAME/REPO.git

# 🔄 已有仓库更新（配置后自动使用代理）
cd existing-repo
git pull
git fetch

# 📁 单个仓库配置（仅当前仓库生效）
cd your-repo
git config url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf "https://github.com/"

# ❌ 取消全局配置
git config --global --unset url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf

# 📋 查看所有 Git 配置
git config --list --show-origin | grep url</pre>
                </div>
                
                <div class="help-item">
                    <h3>📊 Google Sheets 访问</h3>
                    <p>无需 API Key 访问 Google Sheets 数据：</p>
                    <pre># 访问格式
https://${CONFIG.domain}/sheet/YOUR_SHEET_ID

# 示例
https://${CONFIG.domain}/sheet/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

注意：Sheet 需要设置为"任何人都可以查看"</pre>
                </div>
                
                <div class="help-item">
                    <h3>✅ 功能验证示例</h3>
                    <p>以下命令可用于验证各项功能是否正常工作：</p>
                    <pre># 1️⃣  验证直链下载加速
curl -s 'https://${CONFIG.domain}/proxy?url=https://httpbin.org/get' | head -5
# ✓ 应看到 JSON 数据（包含 args, headers 等）

# 2️⃣  验证 GitHub Raw 文件加速
curl -s 'https://${CONFIG.domain}/proxy?url=https://raw.githubusercontent.com/octocat/Hello-World/master/README'
# ✓ 应看到 "Hello World!" 文本

# 3️⃣  验证 GitHub Release 下载
curl -I 'https://${CONFIG.domain}/proxy?url=https://github.com/junegunn/fzf/releases/download/v0.54.0/fzf-0.54.0-linux_amd64.tar.gz'
# ✓ 应看到 HTTP 200 和 Content-Type

# 4️⃣  验证 Git Clone 加速（协议端点）
curl -s 'https://${CONFIG.domain}/proxy/info/refs?url=https://github.com/octocat/Hello-World.git&service=git-upload-pack' | head -3
# ✓ 应看到 "# service=git-upload-pack" 开头的数据

# 5️⃣  验证 Git Clone（实际克隆）
git clone https://${CONFIG.domain}/proxy?url=https://github.com/octocat/Spoon-Knife.git
# ✓ 应成功克隆仓库并看到文件

# 6️⃣  验证全局 Git 配置
git config --global url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf "https://github.com/"
git config --get-regexp url
git clone https://github.com/octocat/Hello-World.git
# ✓ 配置后自动使用代理克隆
# 清理配置：git config --global --unset url."https://${CONFIG.domain}/proxy?url=https://github.com/".insteadOf

# 7️⃣  验证 Google Sheets 代理
curl -s 'https://${CONFIG.domain}/sheet/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' | head -3
# ✓ 应看到 JSON 格式的表格数据

# 8️⃣  验证 Docker Hub API
curl -s 'https://${CONFIG.domain}/v2/'
# ✓ 应看到 {} 或包含 docker 的响应

# 9️⃣  验证 SourceForge 加速
curl -I 'https://${CONFIG.domain}/proxy?url=https://sourceforge.net/'
# ✓ 应看到 HTTP 200 或 302</pre>
                </div>
                
                <div class="help-item">
                    <h3>🔍 故障排查</h3>
                    <div class="faq">
                        <p><strong>Q: Docker 拉取失败？</strong></p>
                        <p>A: 检查 daemon.json 格式是否正确，确保已重启 Docker 服务</p>
                        
                        <p><strong>Q: 路径前缀访问失败？</strong></p>
                        <p>A: 确认路径格式：域名/注册表/镜像名:标签</p>
                        
                        <p><strong>Q: GitHub 下载慢？</strong></p>
                        <p>A: 可能是 GitHub 本身限速，等待后重试</p>
                    </div>
                </div>
                
                <div class="help-item">
                    <h3>💡 提示</h3>
                    <ul>
                        <li>支持断点续传（Range 请求）</li>
                        <li>所有请求都通过 HTTPS 加密</li>
                        <li>不记录用户日志，保护隐私</li>
                        <li>免费使用，无需注册</li>
                        <li>开源项目，代码透明</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <footer>
            <p>Powered by Cloudflare Workers | <a href="https://github.com/iflyelf/proxy-cf" target="_blank">GitHub</a> | <a href="https://www.danxiaonuo.me" target="_blank">xiaonuo</a></p>
            <p style="margin-top: 10px; opacity: 0.8;">开源、免费、无限制</p>
        </footer>
        
        <!-- 返回顶部按钮 -->
        <button class="back-to-top" id="backToTop" onclick="scrollToTop()" title="返回顶部">
            ↑
        </button>
    </div>

    <script>
        // 复制到剪贴板功能
        function copyToClipboard(text, button) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = button.textContent;
                button.textContent = '已复制';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('复制失败:', err);
                button.textContent = '复制失败';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            });
        }
        
        // 为所有代码块添加复制按钮
        document.addEventListener('DOMContentLoaded', () => {
            const preElements = document.querySelectorAll('pre');
            preElements.forEach(pre => {
                // 跳过已经有复制按钮的
                if (pre.parentElement.classList.contains('code-block')) {
                    return;
                }
                
                // 创建容器
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
                
                // 创建复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = '复制';
                copyBtn.onclick = () => copyToClipboard(pre.textContent.trim(), copyBtn);
                
                wrapper.appendChild(copyBtn);
            });
        });
        
        function generateProxyUrl() {
            const url = document.getElementById('url').value.trim();
            const resultDiv = document.getElementById('result');
            
            if (!url) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ 请输入有效的 URL</span>';
                resultDiv.classList.add('show');
                return;
            }

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ URL 必须以 http:// 或 https:// 开头</span>';
                resultDiv.classList.add('show');
                return;
            }

            const proxyUrl1 = window.location.origin + '/proxy?url=' + encodeURIComponent(url);
            const proxyUrl2 = window.location.origin + '?url=' + encodeURIComponent(url);

            resultDiv.innerHTML = \`
                <div style="margin-bottom: 10px;">
                    <strong>✅ 加速链接已生成：</strong>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>方式1（推荐）：</strong><br>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                        <a href="\${proxyUrl1}" target="_blank" style="flex: 1; word-break: break-all;">\${proxyUrl1}</a>
                        <button class="copy-btn" onclick="copyToClipboard('\${proxyUrl1.replace(/'/g, "\\'")}', this)" style="position: static; opacity: 1;">复制</button>
                    </div>
                </div>
                <div>
                    <strong>方式2（备用）：</strong><br>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                        <a href="\${proxyUrl2}" target="_blank" style="flex: 1; word-break: break-all;">\${proxyUrl2}</a>
                        <button class="copy-btn" onclick="copyToClipboard('\${proxyUrl2.replace(/'/g, "\\'")}', this)" style="position: static; opacity: 1;">复制</button>
                    </div>
                </div>
            \`;
            resultDiv.classList.add('show');
        }

        document.getElementById('url').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateProxyUrl();
            }
        });
        
        // Git Clone URL 生成函数
        function generateGitCloneUrl() {
            const gitUrl = document.getElementById('gitUrl').value.trim();
            const resultDiv = document.getElementById('gitResult');
            
            if (!gitUrl) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ 请输入有效的 GitHub 仓库地址</span>';
                resultDiv.classList.add('show');
                return;
            }

            if (!gitUrl.startsWith('https://github.com/') && !gitUrl.startsWith('http://github.com/')) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">❌ 请输入 GitHub 仓库地址（以 https://github.com/ 开头）</span>';
                resultDiv.classList.add('show');
                return;
            }

            // Git Clone 命令行不需要 URL 编码
            const cloneUrl = window.location.origin + '/proxy?url=' + gitUrl;
            const gitCommand = 'git clone ' + cloneUrl;

            resultDiv.innerHTML = \`
                <div style="margin-bottom: 10px;">
                    <strong>✅ Git Clone 命令已生成：</strong>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>单次克隆命令：</strong><br>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; background: var(--bg-secondary); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <code style="flex: 1; word-break: break-all; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;">\${gitCommand}</code>
                        <button class="copy-btn" onclick="copyToClipboard('\${gitCommand.replace(/'/g, "\\'")}', this)" style="position: static; opacity: 1;">复制</button>
                    </div>
                </div>
                <div style="padding: 12px; background: rgba(201, 168, 130, 0.1); border-radius: 6px; border-left: 3px solid var(--color-primary);">
                    <strong>💡 提示：</strong><br>
                    <span style="font-size: 0.9rem; color: var(--color-text-light);">
                    • 直接复制命令到终端执行即可<br>
                    • 无需配置，单次使用<br>
                    • 支持所有 GitHub 公开仓库
                    </span>
                </div>
            \`;
            resultDiv.classList.add('show');
        }

        document.getElementById('gitUrl').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateGitCloneUrl();
            }
        });
        
        // 返回顶部功能
        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // 监听滚动事件，显示/隐藏返回顶部按钮
        window.addEventListener('scroll', function() {
            const backToTopBtn = document.getElementById('backToTop');
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    </script>
</body>
</html>`;
}

// ============================================================================
// Docker Registry 处理
// ============================================================================

async function handleDockerRegistry(request, url) {
  let targetRegistry = 'docker.io';
  let targetPath = url.pathname;
  let registryPrefix = ''; // 用于 Location 和 WWW-Authenticate 重写
  
  // Docker 客户端发送的请求格式：
  // docker pull proxy.domain/registry.k8s.io/coredns:tag
  // 会转换为：GET /v2/registry.k8s.io/coredns/manifests/tag
  // 认证请求：GET /v2/registry.k8s.io/token?...
  
  const pathParts = url.pathname.split('/').filter(p => p);
  
  if (pathParts.length > 0) {
    const firstPart = pathParts[0];
    
    // 情况1: /registry.domain/... 格式（直接以注册表域名开头，非 Docker 标准客户端）
    if (CONFIG.dockerRegistries[firstPart]) {
      targetRegistry = firstPart;
      registryPrefix = '/' + firstPart;
      const remainingPath = pathParts.slice(1).join('/');
      
      if (remainingPath && !remainingPath.startsWith('v2/') && remainingPath !== 'v2') {
        targetPath = '/v2/' + remainingPath;
      } else {
        targetPath = '/' + remainingPath;
      }
    }
    // 情况2: /v2/registry.domain/... 格式（Docker 客户端标准格式）
    else if (firstPart === 'v2' && pathParts.length > 1) {
      const secondPart = pathParts[1];
      
      // 检查第二部分是否是注册表域名
      if (CONFIG.dockerRegistries[secondPart]) {
        targetRegistry = secondPart;
        registryPrefix = '';
        
        // 获取剩余路径部分
        const remainingParts = pathParts.slice(2);
        
        // 检查是否是认证端点（token, proxy_auth, auth 等）
        if (remainingParts.length > 0) {
          const thirdPart = remainingParts[0];
          if (['token', 'proxy_auth', 'auth', '_token'].includes(thirdPart)) {
            // 这是认证端点，直接构建路径
            targetPath = '/' + remainingParts.join('/');
          } else {
            // 普通镜像路径
            targetPath = '/v2/' + remainingParts.join('/');
          }
        } else {
          // 只有 /v2/registry.domain/
          targetPath = '/v2/';
        }
      } else {
        // 默认 Docker Hub
        targetRegistry = 'docker.io';
        targetPath = url.pathname;
        registryPrefix = '';
      }
    }
    // 情况3: 其他 /v2/... 格式（Docker Hub）
    else if (firstPart === 'v2') {
      targetRegistry = 'docker.io';
      targetPath = url.pathname;
      registryPrefix = '';
    }
  }
  
  // 获取上游地址
  const upstream = CONFIG.dockerRegistries[targetRegistry] || CONFIG.defaultDockerUpstream;
  
  // 构建目标 URL
  const targetURL = new URL(upstream);
  targetURL.pathname = targetPath;
  targetURL.search = url.search;

  // 准备请求头
  const headers = new Headers(request.headers);
  headers.set('Host', targetURL.hostname);
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  try {
    const response = await fetch(targetURL.toString(), {
      method: request.method,
      headers: headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      redirect: 'follow',
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.delete('set-cookie');
    newHeaders.set('access-control-allow-origin', '*');
    newHeaders.set('access-control-expose-headers', '*');

    // 重写 WWW-Authenticate 头部
    const wwwAuth = response.headers.get('WWW-Authenticate');
    if (wwwAuth) {
      let modifiedAuth = wwwAuth;
      
      // 如果是 Bearer 认证，需要重写 realm
      if (wwwAuth.startsWith('Bearer ')) {
        // 提取原始 realm 中的路径部分
        const realmMatch = wwwAuth.match(/realm="https?:\/\/[^\/]+(\/[^"]*)"?/);
        const originalRealmPath = realmMatch ? realmMatch[1] : '/token';
        
        // 检查是否是通过路径前缀访问的注册表
        const pathMatch = url.pathname.match(/^\/v2\/([^\/]+)\//);
        const registryInPath = pathMatch ? pathMatch[1] : null;
        
        if (registryInPath && CONFIG.dockerRegistries[registryInPath]) {
          // 通过路径前缀访问的注册表（如 /v2/ghcr.io/...）
          // 构建新的 realm：保留原始路径，但改为我们的代理域名
          const newRealm = `https://${url.hostname}/v2/${registryInPath}${originalRealmPath}`;
          modifiedAuth = wwwAuth.replace(
            /realm="[^"]*"/,
            `realm="${newRealm}"`
          );
        } else {
          // Docker Hub 或直接访问
          const newRealm = `https://${url.hostname}${originalRealmPath}`;
          modifiedAuth = wwwAuth.replace(
            /realm="[^"]*"/,
            `realm="${newRealm}"`
          );
        }
      }
      
      newHeaders.set('WWW-Authenticate', modifiedAuth);
    }

    // 重写 Location 头部
    const location = response.headers.get('Location');
    if (location) {
      try {
        const locationURL = new URL(location);
        // 检查是否是需要重写的域名
        if (locationURL.hostname === targetURL.hostname ||
            locationURL.hostname.includes('docker.io') || 
            locationURL.hostname.includes('docker.com') ||
            Object.keys(CONFIG.dockerRegistries).some(reg => locationURL.hostname.includes(reg))) {
          
          // 构建新的 Location，保持原始请求的路径格式
          let newPath = locationURL.pathname;
          
          // 如果是非 Docker Hub 注册表，需要添加注册表前缀
          if (targetRegistry !== 'docker.io' && targetRegistry !== 'registry-1.docker.io') {
            const pathMatch = url.pathname.match(/^\/v2\/([^\/]+)\//);
            if (pathMatch && CONFIG.dockerRegistries[pathMatch[1]]) {
              // 如果路径是 /v2/xxx，需要改为 /v2/registry.domain/xxx
              if (newPath.startsWith('/v2/') && !newPath.startsWith(`/v2/${pathMatch[1]}/`)) {
                newPath = newPath.replace('/v2/', `/v2/${pathMatch[1]}/`);
              }
            }
          }
          
          const newLocation = `https://${url.hostname}${newPath}${locationURL.search}`;
          newHeaders.set('Location', newLocation);
        }
      } catch (e) {
        // Location 可能是相对路径，不处理
      }
    }
    
    // 重写 Docker-Content-Digest 相关的链接（如果有）
    const dockerContentDigest = response.headers.get('Docker-Content-Digest');
    if (dockerContentDigest) {
      newHeaders.set('Docker-Content-Digest', dockerContentDigest);
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    return makeRes(JSON.stringify({
      errors: [{
        code: 'UPSTREAM_ERROR',
        message: error.message,
        registry: targetRegistry,
        path: targetPath,
        upstream: upstream,
      }]
    }), 502, { 'Content-Type': 'application/json' });
  }
}

// ============================================================================
// GitHub 加速处理
// ============================================================================

async function handleGitHub(request, url) {
  // 从路径中提取目标 URL：/https://github.com/... -> https://github.com/...
  let targetUrl = url.pathname.slice(1) + url.search;
  
  // 验证 URL 格式
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return makeRes('Invalid URL: must start with http:// or https://', 400);
  }

  try {
    // 复制原始请求头，但移除某些头部
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      redirect: 'follow',
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set('access-control-allow-origin', '*');
    newHeaders.set('access-control-expose-headers', '*');
    newHeaders.delete('content-security-policy');
    newHeaders.delete('x-frame-options');
    
    // 保留 Content-Disposition 用于下载
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      newHeaders.set('content-disposition', contentDisposition);
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    return makeRes(`Error fetching ${targetUrl}: ${error.message}`, 502);
  }
}

// ============================================================================
// Google Sheets 代理
// ============================================================================

async function handleGoogleSheet(request, url) {
  const sheetId = url.pathname.split('/')[2];
  
  if (!sheetId) {
    return makeRes('Invalid Sheet ID', 400);
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  try {
    const response = await fetch(sheetUrl);
    const text = await response.text();
    const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    
    return makeRes(jsonText, 200, {
      'Content-Type': 'application/json',
    });
  } catch (error) {
    return makeRes(`Error: ${error.message}`, 502);
  }
}

// ============================================================================
// 直链下载处理
// ============================================================================

async function handleDirectDownload(request, url) {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(generateHomePage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? request.body : null,
    });

    const urlPath = new URL(targetUrl).pathname;
    const fileName = urlPath.substring(urlPath.lastIndexOf('/') + 1) || 'download';

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('access-control-allow-origin', '*');
    responseHeaders.set('access-control-expose-headers', '*');
    responseHeaders.set('accept-ranges', 'bytes');
    responseHeaders.set('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    if (request.headers.has('Range')) {
      responseHeaders.set('Content-Range', request.headers.get('Range'));
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return makeRes(`Error: ${error.message}`, 502);
  }
}

// 处理 DockerHub library 镜像重定向
function handleDockerHubLibraryRedirect(pathname) {
  const pathParts = pathname.split('/');
  if (pathParts.length === 5 && pathParts[1] === 'v2' && !pathParts[2].includes('/')) {
    pathParts.splice(2, 0, 'library');
    return pathParts.join('/');
  }
  return null;
}

// ============================================================================
// 主处理函数
// ============================================================================

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, PREFLIGHT_INIT);
  }

  // 根路径 - 直链下载或主页
  if (url.pathname === '/') {
    return handleDirectDownload(request, url);
  }

  // 调试端点 - 查看请求详情
  if (url.pathname === '/debug-request') {
    return makeRes(JSON.stringify({
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      search: url.search,
      headers: Object.fromEntries(request.headers),
    }, null, 2), 200, { 'Content-Type': 'application/json' });
  }
  
  // 直接测试 pathname 匹配
  if (url.pathname === '/debug-path') {
    const testPaths = [
      '/https://github.com/test',
      '/https://httpbin.org/get',
      '/http://example.com'
    ];
    return makeRes(JSON.stringify({
      actualPathname: url.pathname,
      testResults: testPaths.map(p => ({
        path: p,
        startsWithHttps: p.startsWith('/https://'),
        startsWithHttp: p.startsWith('/http://'),
        wouldMatch: p.startsWith('/http://') || p.startsWith('/https://')
      })),
      actualPathnameCheck: {
        startsWithHttps: url.pathname.startsWith('/https://'),
        startsWithHttp: url.pathname.startsWith('/http://'),
        firstChar: url.pathname[0],
        first8Chars: url.pathname.substring(0, 8)
      }
    }, null, 2), 200, { 'Content-Type': 'application/json' });
  }

  // 测试路由端点
  if (url.pathname === '/test-route') {
    const testPath = '/https://github.com/test';
    return makeRes(JSON.stringify({
      testPath: testPath,
      startsWithHttps: testPath.startsWith('/https://'),
      startsWithHttp: testPath.startsWith('/http://'),
      routeOrder: [
        '1. OPTIONS check',
        '2. Root path check',
        '3. debug-request check',
        '4. test-route check (YOU ARE HERE)',
        '5. GitHub URL check (startsWith /http:// or /https://)',
        '6. pathParts check',
        '7. Docker v2 check',
        '8. Google Sheets check',
        '9. debug check',
        '10. 404'
      ]
    }, null, 2), 200, { 'Content-Type': 'application/json' });
  }
  
  // GitHub 加速测试端点
  if (url.pathname === '/test-github') {
    const testUrl = 'https://httpbin.org/get';
    try {
      const response = await fetch(testUrl);
      const data = await response.text();
      return makeRes(JSON.stringify({
        success: true,
        targetUrl: testUrl,
        statusCode: response.status,
        contentPreview: data.substring(0, 200)
      }, null, 2), 200, { 'Content-Type': 'application/json' });
    } catch (error) {
      return makeRes(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2), 500, { 'Content-Type': 'application/json' });
    }
  }
  
  // Git 代理调试端点
  if (url.pathname.startsWith('/test-git-proxy')) {
    const urlParam = url.searchParams.get('url');
    const extraPath = url.pathname.substring('/test-git-proxy'.length);
    const params = new URLSearchParams(url.search);
    params.delete('url');
    
    let targetUrl = urlParam;
    if (extraPath) {
      targetUrl = targetUrl + extraPath;
    }
    if (params.toString()) {
      targetUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
    }
    
    return makeRes(JSON.stringify({
      originalPath: url.pathname,
      originalSearch: url.search,
      urlParam: urlParam,
      extraPath: extraPath,
      extraParams: params.toString(),
      targetUrl: targetUrl
    }, null, 2), 200, { 'Content-Type': 'application/json' });
  }

  // GitHub 和其他 URL 加速 - 方式1：/https://... 格式（可能被 Cloudflare 阻止）
  if (url.pathname.startsWith('/http://') || url.pathname.startsWith('/https://')) {
    return handleGitHub(request, url);
  }
  
  // GitHub 和其他 URL 加速 - 方式2：/proxy?url=... 格式（推荐）
  if (url.pathname.startsWith('/proxy')) {
    // 处理两种情况：
    // 1. /proxy?url=... （普通文件下载）
    // 2. /proxy/path/to/resource （Git clone 附加的路径）
    
    let targetUrl;
    
    if (url.searchParams.has('url')) {
      // 情况1：有 url 参数
      targetUrl = url.searchParams.get('url');
      
      // 如果路径不是 /proxy，说明 Git 添加了额外路径（如 /info/refs）
      if (url.pathname !== '/proxy') {
        const extraPath = url.pathname.substring('/proxy'.length);
        targetUrl = targetUrl + extraPath;
      }
      
      // 添加原始的查询参数（除了 url 参数）
      const params = new URLSearchParams(url.search);
      params.delete('url');
      if (params.toString()) {
        targetUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + params.toString();
      }
      
      // 调试日志
      console.log('Git proxy debug:', {
        originalPath: url.pathname,
        originalSearch: url.search,
        targetUrl: targetUrl
      });
    } else {
      // 情况2：没有 url 参数，整个路径就是目标
      return makeRes('Missing url parameter', 400);
    }
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return makeRes('Invalid URL: must start with http:// or https://', 400);
    }
    
    // 直接代理请求，不通过 handleGitHub
    try {
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ipcountry');
      headers.delete('cf-ray');
      headers.delete('cf-visitor');
      
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
        redirect: 'follow',
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set('access-control-allow-origin', '*');
      newHeaders.set('access-control-expose-headers', '*');
      newHeaders.delete('content-security-policy');
      newHeaders.delete('x-frame-options');
      
      // 保留 Content-Disposition 用于下载
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        newHeaders.set('content-disposition', contentDisposition);
      }

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (error) {
      return makeRes(`Error fetching ${targetUrl}: ${error.message}`, 502);
    }
  }

  // 检查是否是注册表路径前缀（例如 /ghcr.io/... 或 /gcr.io/...）
  const pathParts = url.pathname.split('/').filter(p => p);
  const firstPart = pathParts[0];
  
  // 如果路径以已知的注册表域名开头，作为 Docker Registry 请求处理
  if (CONFIG.dockerRegistries[firstPart]) {
    return handleDockerRegistry(request, url);
  }

  // Docker Registry API (/v2/ 路径) - 包括认证端点
  if (url.pathname.startsWith('/v2/')) {
    // 处理 DockerHub library 重定向
    const redirectPath = handleDockerHubLibraryRedirect(url.pathname);
    if (redirectPath) {
      const redirectUrl = new URL(url);
      redirectUrl.pathname = redirectPath;
      return Response.redirect(redirectUrl.toString(), 301);
    }
    
    return handleDockerRegistry(request, url);
  }

  // Google Sheets 代理
  if (url.pathname.startsWith('/sheet/')) {
    return handleGoogleSheet(request, url);
  }

  // 调试信息
  if (url.pathname === '/debug') {
    const pathParts = url.pathname.split('/').filter(p => p);
    return makeRes(JSON.stringify({
      version: '1.9.1',  // 版本号
      buildDate: '2024-10-15T15:05:00Z',
      domain: CONFIG.domain,
      dockerRegistries: Object.keys(CONFIG.dockerRegistries),
      features: [
        'GitHub 加速',
        'Docker 镜像代理 (支持路径前缀访问)',
        'SourceForge 加速',
        'Google Sheets 代理',
        '直链下载加速'
      ],
      usage: {
        dockerHub: 'registry-mirrors 配置',
        otherRegistries: '/{registry}/v2/{image}',
        examples: {
          ghcr: '/ghcr.io/v2/owner/image/manifests/tag',
          gcr: '/gcr.io/v2/project/image/manifests/tag',
          k8s: '/registry.k8s.io/v2/coredns/manifests/v1.10.0',
          quay: '/quay.io/v2/repo/image/manifests/tag'
        }
      },
      tips: [
        '路径格式: /{registry}/v2/{namespace}/{image}/manifests/{tag}',
        'Docker 会自动添加 /v2 前缀',
        '使用格式: docker pull domain/{registry}/{namespace}/{image}:{tag}'
      ]
    }, null, 2), 200, { 'Content-Type': 'application/json' });
  }

  // 404
  return makeRes('Not Found', 404);
}

// ============================================================================
// 事件监听
// ============================================================================

addEventListener('fetch', (event) => {
  event.respondWith(
    handleRequest(event.request).catch((err) => {
      console.error('Error:', err);
      return new Response('Internal Server Error', { status: 500 });
    })
  );
});
