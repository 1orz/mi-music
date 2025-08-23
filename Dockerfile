FROM python:3.13 AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 先复制依赖文件，利用构建缓存
COPY requirements.txt ./

# 安装 Python 依赖
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir aiohttp==3.12.15 aiofiles==24.1.0 \
    && pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

EXPOSE 8000

# 默认以 uvicorn 启动服务（如需变更端口/参数，可在 docker run 时覆盖）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]