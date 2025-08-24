# 小米音响控制台前端

基于 React 19 + TypeScript + Ant Design 5.27.1 构建的现代化小米音响远程控制系统前端。

## 功能特性

### 🔐 系统认证
- 基于 JWT 的双重登录机制
- 系统用户登录 + 小米账号登录
- 自动令牌刷新和状态管理
- 受保护的路由组件

### 🎵 设备管理
- 智能设备发现和列表展示
- 设备状态实时监控（在线状态、音量、播放状态）
- 设备选择器支持别名、名称、设备ID多种选择方式
- 设备信息详细展示（硬件型号、能力等）

### 🎮 播放控制
- URL 链接播放（支持音频/视频流）
- 播放/暂停/停止控制
- 实时音量调节（滑块 + 快捷按钮）
- 播放状态查询和显示

### 🗣️ 语音播报 (TTS)
- 自定义文字转语音
- 常用语音快捷按钮
- 优化的 MiIO/MiNA 双重支持
- 500字符长度限制和实时计数

### 🎨 用户体验
- 响应式设计，支持桌面和移动端
- 现代化 Ant Design 界面
- 实时状态反馈和错误提示
- 中文本地化支持

## 技术栈

- **React 19** - 最新版本，支持 Suspense 和并发特性
- **TypeScript 5** - 严格模式，类型安全
- **Ant Design 5.27.1** - 企业级 UI 组件库
- **Vite** - 极速构建工具
- **Axios** - HTTP 客户端，支持拦截器和自动重试
- **dayjs** - 轻量级日期处理库

## 项目结构

```
src/
├── components/           # 通用组件
│   ├── Auth/            # 认证相关（路由保护）
│   ├── Device/          # 设备管理（选择器、状态）
│   ├── Layout/          # 布局组件（主框架）
│   └── Player/          # 播放控制（控制面板、TTS）
├── pages/               # 页面组件
│   ├── Dashboard/       # 控制台主页
│   ├── Login/           # 登录页面
│   └── Settings/        # 设置页面
├── services/            # API 服务层
│   ├── auth.ts         # 系统认证接口
│   ├── device.ts       # 设备管理接口
│   ├── player.ts       # 播放控制接口
│   └── xiaomi.ts       # 小米账号接口
├── hooks/               # 自定义 Hooks
│   ├── useAuth.ts      # 认证状态管理
│   ├── useDevices.ts   # 设备状态管理
│   └── useXiaomi.ts    # 小米账号状态管理
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数（HTTP 客户端）
└── styles/              # 全局样式
```

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 环境配置

创建 `.env` 文件：

```env
# API 服务器地址
VITE_API_BASE_URL=http://localhost:8000
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

## API 集成

前端已完整集成后端所有接口：

### 系统认证
- `POST /auth/login` - 系统登录
- `POST /auth/refresh` - 令牌刷新
- `GET /auth/status` - 认证状态查询

### 小米账号管理
- `POST /mi/account/login` - 小米账号登录
- `POST /mi/account/logout` - 小米账号登出
- `GET /mi/account/status` - 小米账号状态

### 设备管理
- `GET /devices` - 获取设备列表

### 播放控制
- `POST /mi/device/playback/play-url` - 播放 URL
- `POST /mi/device/playback/play` - 恢复播放
- `POST /mi/device/playback/pause` - 暂停播放
- `POST /mi/device/playback/stop` - 停止播放
- `GET /mi/device/playback/status` - 查询播放状态

### 设备控制
- `POST /mi/device/tts` - 文字转语音
- `POST /mi/device/volume` - 设置音量
- `GET /mi/device/volume` - 获取音量

## 核心特性实现

### 自动令牌刷新
- HTTP 拦截器检测 401 错误
- 自动使用 refresh token 获取新的 access token
- 重新发送失败的请求
- 刷新失败时自动跳转登录页

### 状态管理
- 基于 React Hooks 的轻量级状态管理
- 认证状态：用户信息、登录状态、令牌管理
- 设备状态：设备列表、选中设备、缓存机制
- 小米账号状态：连接状态、设备数量

### 错误处理
- 统一错误提示机制
- 网络错误重试机制
- 友好的用户反馈

### 响应式设计
- 移动端适配
- 侧边栏自动收缩
- 栅格布局适应不同屏幕尺寸

## 最佳实践

### 组件设计
- 函数组件 + Hooks 模式
- Props 类型严格定义
- 组件功能单一职责
- 可复用性考虑

### 代码规范
- TypeScript 严格模式
- ESLint + Prettier 代码格式化
- 统一的文件命名规范
- 清晰的注释和类型定义

### 性能优化
- 按需加载 Ant Design 组件
- HTTP 请求缓存机制
- 避免不必要的重复渲染
- 合理的状态管理

## 部署建议

1. **生产构建**：使用 `pnpm build` 生成优化后的静态文件
2. **环境变量**：根据部署环境配置 `VITE_API_BASE_URL`
3. **静态托管**：可部署到 Nginx、Apache 或 CDN
4. **反向代理**：建议通过反向代理统一前后端访问入口
5. **HTTPS**：生产环境建议启用 HTTPS

## 故障排除

### 常见问题

1. **无法连接后端**：检查 `VITE_API_BASE_URL` 配置
2. **登录失败**：确认后端服务正常启动，检查用户名密码配置
3. **设备列表为空**：确认已登录小米账号且账号下有可控制的设备
4. **控制命令无响应**：检查设备在线状态和网络连接

### 开发调试

- 打开浏览器开发者工具查看控制台错误
- Network 面板查看 API 请求响应
- React DevTools 检查组件状态
- 使用 `console.log` 调试关键状态变化

## 许可证

本项目采用 MIT 许可证。