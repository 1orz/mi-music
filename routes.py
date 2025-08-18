from typing import Callable
import json
import logging

from fastapi import APIRouter, Depends, HTTPException

from auth import JWTAuth, authenticate_system_user
from mi_session import MinaProvider
from schemas import (
    ApiResponse,
    SystemLoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenRefreshResponse,
    XiaomiLoginRequest,
    DeviceInfo,
    PlayUrlRequest,
    VolumeRequest,
    TTSRequest,
    PlayControlRequest,
)
from utils import build_music_payload, sanitize_tts_text, parse_tts_cmd, find_device_info_by_id


LOGGER = logging.getLogger("xiaomi_api.routes")


def get_router(jwt_auth: JWTAuth, system_users: dict, get_provider: Callable[[], MinaProvider]) -> APIRouter:
    """组合系统认证与小米控制的统一路由。"""

    router = APIRouter()

    # ============ 系统认证 ============

    @router.post("/auth/login", response_model=LoginResponse)
    async def auth_login(request: SystemLoginRequest):
        """系统登录，返回 access/refresh。"""
        if not authenticate_system_user(request.username, request.password, system_users):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        token_data = {"sub": request.username}
        return LoginResponse(
            success=True,
            message="系统登录成功",
            access_token=jwt_auth.create_access_token(token_data),
            refresh_token=jwt_auth.create_refresh_token(token_data),
            token_type="bearer",
        )

    @router.post("/auth/refresh", response_model=TokenRefreshResponse)
    async def auth_refresh(request: RefreshTokenRequest):
        """刷新访问令牌。"""
        payload = jwt_auth.verify_token(request.refresh_token, "refresh")
        token_data = {"sub": payload.get("sub")}
        return TokenRefreshResponse(
            success=True,
            message="Token 刷新成功",
            access_token=jwt_auth.create_access_token(token_data),
            refresh_token=jwt_auth.create_refresh_token(token_data),
            token_type="bearer",
        )

    @router.get("/auth/status")
    async def auth_status(current_user=Depends(jwt_auth.get_current_user)):
        """查询系统登录状态。"""
        return {
            "detail": "系统已登录",
            "user": current_user.get("sub"),
            "should_refresh": current_user.get("_should_refresh", False),
        }

    # ============ 小米会话/设备/控制（需系统 JWT） ============

    def provider_dep() -> MinaProvider:
        return get_provider()

    @router.post("/mi/account/login", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def mi_login(request: XiaomiLoginRequest, provider: MinaProvider = Depends(provider_dep)):
        """小米账号登录，初始化/更新小米会话。"""
        if not request.username or not request.password:
            raise HTTPException(status_code=400, detail="请提供小米账号与密码")
        await provider.login(request.username, request.password)
        devices = await provider.device_list()
        return ApiResponse(success=True, message="小米登录成功", data={"devices_count": len(devices)})

    @router.post("/mi/account/logout", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def mi_logout(provider: MinaProvider = Depends(provider_dep)):
        """小米账号登出，清理会话与会话文件。"""
        await provider.logout()
        return ApiResponse(success=True, message="小米账号已登出")

    @router.get("/mi/account/status", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def mi_status(provider: MinaProvider = Depends(provider_dep)):
        """查询小米登录状态。"""
        try:
            await provider.ensure_mina()
            count = len(await provider.device_list())
            return ApiResponse(success=True, message="小米已登录", data={"logged_in": True, "devices_count": count})
        except HTTPException:
            return ApiResponse(success=False, message="小米未登录", data={"logged_in": False})

    @router.get("/devices", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def get_devices(provider: MinaProvider = Depends(provider_dep)):
        """获取设备列表。"""
        devices = await provider.device_list()
        device_list = [
            DeviceInfo(
                deviceID=d.get("deviceID", ""),
                name=d.get("name"),
                alias=d.get("alias"),
                miotDID=str(d.get("miotDID", "")),
                hardware=d.get("hardware"),
                capabilities=d.get("capabilities"),
            )
            for d in devices
        ]
        return ApiResponse(success=True, message=f"获取到 {len(device_list)} 台设备", data=device_list)

    @router.post("/mi/device/playback/play-url", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def play_url(request: PlayUrlRequest, provider: MinaProvider = Depends(provider_dep)):
        """播放指定 URL。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        music = build_music_payload(request.url)
        result = await mina.ubus_request(
            device_id,
            "player_play_music",
            "mediaplayer",
            {"startaudioid": 1582971365183456177, "music": json.dumps(music)},
        )
        return ApiResponse(success=True, message="播放命令已发送", data={"result": result, "device_id": device_id})

    @router.post("/mi/device/playback/pause", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def pause_playback(request: PlayControlRequest, provider: MinaProvider = Depends(provider_dep)):
        """暂停播放。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        result = await mina.ubus_request(device_id, "player_play_operation", "mediaplayer", {"action": "pause", "media": "app_ios"})
        return ApiResponse(success=True, message="暂停命令已发送", data={"result": result, "device_id": device_id})

    @router.post("/mi/device/playback/play", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def playback_play(request: PlayControlRequest, provider: MinaProvider = Depends(provider_dep)):
        """恢复播放。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        result = await mina.ubus_request(device_id, "player_play_operation", "mediaplayer", {"action": "play", "media": "app_ios"})
        return ApiResponse(success=True, message="恢复播放命令已发送", data={"result": result, "device_id": device_id})

    @router.post("/mi/device/playback/stop", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def playback_stop(request: PlayControlRequest, provider: MinaProvider = Depends(provider_dep)):
        """停止播放。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        result = await mina.ubus_request(device_id, "player_play_operation", "mediaplayer", {"action": "stop", "media": "app_ios"})
        return ApiResponse(success=True, message="停止命令已发送", data={"result": result, "device_id": device_id})

    @router.get("/mi/device/playback/status", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def playback_status(device_selector: str, provider: MinaProvider = Depends(provider_dep)):
        """查询播放状态。支持 device_selector（deviceID/miotDID/alias/name）。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(device_selector)
        payload = {
            "deviceId": device_id,
            "message": json.dumps({"media": "app_ios"}),
            "method": "player_get_play_status",
            "path": "mediaplayer",
        }
        resp = await mina.mina_request("/remote/ubus", payload)
        try:
            if isinstance(resp, dict) and isinstance(resp.get("data"), dict):
                info = resp["data"].get("info")
                if isinstance(info, str):
                    parsed_info = json.loads(info)
                    resp["data"]["info"] = parsed_info
        except Exception:
            pass
        return ApiResponse(success=bool(resp and resp.get("code") == 0), message="获取播放状态", data={"status": resp, "device_id": device_id})

    @router.post("/mi/device/tts", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def tts_speak(request: TTSRequest, provider: MinaProvider = Depends(provider_dep)):
        """文字转语音，优先 MiIO，回退 MiNA。"""
        from const import TTS_COMMAND
        from miservice import MiIOService

        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        devices = await provider.device_list()
        device_info = find_device_info_by_id(devices, device_id)
        hardware = device_info.get("hardware") if device_info else None
        if hardware and hardware in TTS_COMMAND:
            did = str(device_info.get("miotDID") or "")
            if did.isdigit():
                miio_service = MiIOService(mina.account)
                siid, aiid = parse_tts_cmd(TTS_COMMAND[hardware])
                text_no_spaces = sanitize_tts_text(request.text)
                result = await miio_service.miot_action(did, (siid, aiid), [text_no_spaces])
                return ApiResponse(success=True, message="文字转语音命令已发送(miio)", data={"result": result, "device_id": device_id})
        # fallback
        result = await mina.text_to_speech(device_id, request.text)
        return ApiResponse(success=True, message="文字转语音命令已发送(mina)", data={"result": result, "device_id": device_id})

    @router.post("/mi/device/volume", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def set_volume(request: VolumeRequest, provider: MinaProvider = Depends(provider_dep)):
        """设置音量。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(request.device_selector)
        result = await mina.player_set_volume(device_id, request.volume)
        return ApiResponse(success=True, message=f"音量已设置为 {request.volume}", data={"result": result, "device_id": device_id})

    @router.get("/mi/device/volume", response_model=ApiResponse, dependencies=[Depends(jwt_auth.get_current_user)])
    async def get_volume(device_selector: str, provider: MinaProvider = Depends(provider_dep)):
        """获取设备当前音量。"""
        mina = await provider.ensure_mina()
        device_id = await provider.resolve_device_id(device_selector)
        payload = {
            "deviceId": device_id,
            "message": json.dumps({"media": "app_ios"}),
            "method": "player_get_play_status",
            "path": "mediaplayer",
        }
        resp = await mina.mina_request("/remote/ubus", payload)
        volume_val = None
        try:
            if isinstance(resp, dict) and isinstance(resp.get("data"), dict):
                info = resp["data"].get("info")
                if isinstance(info, str):
                    info = json.loads(info)
                if isinstance(info, dict):
                    volume_val = info.get("volume")
        except Exception:
            pass
        if isinstance(volume_val, int):
            return ApiResponse(success=True, message="获取音量", data={"volume": volume_val, "device_id": device_id})
        raise HTTPException(status_code=500, detail="获取音量失败")

    return router


