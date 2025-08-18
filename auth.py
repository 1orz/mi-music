import logging
from datetime import datetime, timedelta, UTC
from typing import Dict, Any, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


LOGGER = logging.getLogger("xiaomi_api.auth")


class JWTAuth:
    def __init__(self, secret_key: str, algorithm: str = "HS256", access_minutes: int = 60, refresh_days: int = 7, auto_refresh_threshold_minutes: int = 10):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_minutes = access_minutes
        self.refresh_days = refresh_days
        self.auto_refresh_threshold_minutes = auto_refresh_threshold_minutes
        self.security = HTTPBearer()

    def create_access_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.now(UTC) + timedelta(minutes=self.access_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.now(UTC) + timedelta(days=self.refresh_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("type") != token_type:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token 类型错误，期望 {token_type}")
            return payload
        except jwt.ExpiredSignatureError:
            # 区分过期
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 已过期，请使用刷新令牌重新获取访问令牌")
        except jwt.InvalidSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 签名无效")
        except jwt.DecodeError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 解析失败")
        except jwt.PyJWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效")

    def check_token_should_refresh(self, payload: Dict[str, Any]) -> bool:
        exp = payload.get("exp")
        if not exp:
            return True
        exp_time = datetime.fromtimestamp(exp, tz=UTC)
        time_left = exp_time - datetime.now(UTC)
        return time_left.total_seconds() < (self.auto_refresh_threshold_minutes * 60)

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> Dict[str, Any]:
        token = credentials.credentials
        payload = self.verify_token(token, "access")
        if self.check_token_should_refresh(payload):
            payload["_should_refresh"] = True
        return payload


def authenticate_system_user(username: str, password: str, users: Dict[str, str]) -> bool:
    expected_password = users.get(username)
    return expected_password is not None and expected_password == password


