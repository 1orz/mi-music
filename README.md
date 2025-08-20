# 小米音响控制 API

基于 FastAPI 和 MiService 的小米音响控制接口。

## 使用流程

## 认证与会话

1. `POST /auth/login` 使用系统账号登录，获取 `access_token` 与 `refresh_token`
2. 在 Swagger UI 右上角 🔒 **Authorize** 输入 `Bearer {access_token}`
3. （可选）`GET /auth/status` 查看系统登录状态
4. `POST /mi/account/login` 在系统已登录前提下登录小米账号（需提供小米账号与密码）
5. `GET /mi/account/status` 查看小米登录状态；`POST /mi/account/logout` 登出小米账号
6. 使用设备与播放控制接口（均需系统已登录，且小米已登录）

## 兼容提醒

我只有一台小米音响Play增强版(L05C)，所以只测试了该设备, 其他设备未测试, 期待你的反馈!

## 功能特性

- 🔐 系统 JWT 认证（支持刷新）
- 🔒 系统登录与小米账号登录解耦
- 🎵 播放控制（播放URL、暂停、恢复）
- 🔊 音量控制
- 🗣️ 文字转语音
- 📱 设备管理

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 `conf/config.yml`

请勿将真实配置提交到仓库。仓库已提供 `config.example.yml`，请复制到 `conf/config.yml` 并按需修改：

```bash
mkdir -p conf
cp config.example.yml conf/config.yml
```

示例片段：

```yaml
system_auth:
  users:
    - username: "admin"
      password: "change-me"

jwt:
  secret_key: "请填写强随机密钥"  # 可用下面命令生成：
  # python -c "import secrets; print(secrets.token_hex(32))"
  algorithm: "HS256"
  access_token_expire_minutes: 60
  refresh_token_expire_days: 7
```

### 3. 启动服务

```bash
python main.py
# 或
uvicorn main:app --reload
```

### 4. 访问 API

- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### 5. 使用 Docker 运行

```bash
# 1) 构建镜像
docker build -t music-mi:latest .

# 2) 运行容器（挂载本地配置与会话文件）
docker run -d --name music-mi \
  -p 8000:8000 \
  -v $(pwd)/conf/config.yml:/app/conf/config.yml:ro \
  -v $(pwd)/conf/.mi_account_session.json:/app/conf/.mi_account_session.json \
  music-mi:latest

# 3) 健康检查
curl http://localhost:8000/health
```

提示：
- 请先用 `mkdir -p conf && cp config.example.yml conf/config.yml` 创建并填写你的配置。
- 默认容器监听 0.0.0.0:8000，生产环境建议置于反向代理之后，并开启 TLS。

### 主要接口

- 认证
  - `POST /auth/login` - 系统登录（颁发 JWT）
  - `POST /auth/refresh` - 刷新 Token
  - `GET /auth/status` - 查看系统登录状态与小米会话概览

- 小米账号
  - `POST /mi/account/login` - 小米登录
  - `POST /mi/account/logout` - 小米登出
  - `GET /mi/account/status` - 小米登录状态

- 设备与播放
  - `GET /devices` - 获取设备列表
  - `POST /mi/device/playback/play-url` - 播放 URL
  - `POST /mi/device/playback/pause` - 暂停播放
  - `POST /mi/device/playback/play` - 恢复播放
  - `POST /mi/device/playback/stop` - 停止播放
  - `GET /mi/device/playback/status` - 播放状态
  - `POST /mi/device/volume` - 设置音量
  - `GET /mi/device/volume` - 获取音量
  - `POST /mi/device/tts` - 文字转语音

## 备注

- 系统登录与小米登录完全解耦：必须先系统登录成功，才允许调用任何小米相关接口。
- 会话文件固定保存在 `conf/.mi_account_session.json`（代码中硬编码，无需配置）。

## 许可证

MIT License

## Credits

- [miservice](https://github.com/Yonsm/MiService)
- [miservice-fork](https://pypi.org/project/miservice-fork)
- [fastapi](https://github.com/fastapi/fastapi)
- [jwt](https://github.com/jpadilla/pyjwt)
  