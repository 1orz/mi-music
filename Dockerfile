# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 安装运行时必须的系统依赖（如需）
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖文件，利用构建缓存
COPY requirements.txt ./

# 安装 Python 依赖
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir aiohttp==3.12.15 aiofiles==24.1.0
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户并切换（确保对工作目录有写权限）
RUN useradd -m appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# 默认以 uvicorn 启动服务（如需变更端口/参数，可在 docker run 时覆盖）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


