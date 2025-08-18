from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class SystemLoginRequest(BaseModel):
    username: str = Field(..., description="系统用户名")
    password: str = Field(..., description="系统密码")


class LoginResponse(BaseModel):
    success: bool
    message: str
    masked_account: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None
    refresh_expires_in: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="刷新令牌")


class TokenRefreshResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None
    refresh_expires_in: Optional[int] = None


class XiaomiLoginRequest(BaseModel):
    username: Optional[str] = Field(None, description="小米账号（留空则使用 config.yml 中的账号）")
    password: Optional[str] = Field(None, description="小米密码（留空则使用 config.yml 中的密码）")


class DeviceInfo(BaseModel):
    deviceID: str
    name: Optional[str] = None
    alias: Optional[str] = None
    miotDID: Optional[str] = None
    hardware: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None


class PlayUrlRequest(BaseModel):
    device_selector: str = Field(..., description="设备选择器", example="笨蛋小然", title="设备选择器")
    url: str = Field(..., description="播放URL", example="https://lhttp.qtfm.cn/live/4915/64k.mp3")
    type: int = Field(default=2, description="播放类型", example=2, title="播放类型 (1=音乐, 2=其他)")


class VolumeRequest(BaseModel):
    device_selector: str = Field(..., description="设备选择器", example="笨蛋小然", title="设备选择器")
    volume: int = Field(..., ge=0, le=100, description="音量 (0-100)", example=50)


class TTSRequest(BaseModel):
    device_selector: str = Field(..., description="设备选择器", example="笨蛋小然", title="设备选择器")
    text: str = Field(..., description="要转换的文字", example="你好，小米音响")


class PlayControlRequest(BaseModel):
    device_selector: str = Field(..., description="设备选择器", example="笨蛋小然", title="设备选择器")


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


