import asyncio
import logging
import os
from typing import Optional, Dict, Any, List

from aiohttp import ClientSession, ClientTimeout
from cachetools import TTLCache
from fastapi import HTTPException, status

from miservice import MiAccount, MiNAService, MiIOService


LOGGER = logging.getLogger("xiaomi_api.session")


class MinaProvider:
    """封装 Xiaomi 会话、设备列表 TTL 缓存与并发锁。"""

    def __init__(self, token_path: str, http_session: Optional[ClientSession] = None):
        self.token_path = token_path
        self.http_session = http_session
        self.mi_account: Optional[MiAccount] = None
        self.mina_service: Optional[MiNAService] = None
        self._lock = asyncio.Lock()
        # 设备列表缓存：最大 64 条，TTL 30 秒
        self._devices_cache = TTLCache(maxsize=64, ttl=30)
        # 文件监听
        self._watch_task: Optional[asyncio.Task] = None
        self._stop_watch_event: Optional[asyncio.Event] = None
        self._last_mtime: Optional[float] = None

    def set_http_session(self, session: ClientSession) -> None:
        self.http_session = session

    async def try_restore_from_file(self) -> bool:
        if self.http_session is None:
            return False
        # 只读取本地 token，不自动重登
        account = MiAccount(self.http_session, "", "", self.token_path)
        token = await account.token_store.load_token()
        if not token:
            return False
        account.token = token
        # 调一次设备列表检查 token 是否可用
        headers = {'User-Agent': 'MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103'}
        url = 'https://api2.mina.mi.com/admin/v2/device_list?master=0'
        try:
            resp = await account.mi_request('micoapi', url, None, headers, relogin=False)
            if resp and resp.get('code') == 0:
                self.mi_account = account
                self.mina_service = MiNAService(account)
                return True
            return False
        except Exception as exc:
            LOGGER.warning("会话文件验证失败：%s", exc)
            return False

    async def _watch_session_file(self, interval_seconds: float = 2.0) -> None:
        """后台任务：监听 token 文件变化，自动热加载/清理会话。"""
        self._last_mtime = os.path.getmtime(self.token_path) if os.path.exists(self.token_path) else None
        headers = {'User-Agent': 'MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103'}
        url = 'https://api2.mina.mi.com/admin/v2/device_list?master=0'
        stop_event = self._stop_watch_event
        while stop_event and not stop_event.is_set():
            await asyncio.sleep(interval_seconds)
            try:
                exists = os.path.exists(self.token_path)
                mtime = os.path.getmtime(self.token_path) if exists else None
                if mtime != self._last_mtime:
                    self._last_mtime = mtime
                    if exists and self.http_session is not None:
                        LOGGER.info("检测到会话文件变更，尝试热加载…")
                        account = MiAccount(self.http_session, "", "", self.token_path)
                        token = await account.token_store.load_token()
                        if token:
                            account.token = token
                            try:
                                resp = await account.mi_request('micoapi', url, None, headers, relogin=False)
                                if resp and resp.get('code') == 0:
                                    self.mi_account = account
                                    self.mina_service = MiNAService(account)
                                    self._devices_cache.clear()
                                    LOGGER.info("会话文件热加载成功")
                                else:
                                    LOGGER.warning("会话文件热加载验证失败(code!=0)，保持现状")
                            except Exception as exc:
                                LOGGER.warning("会话文件热加载失败：%s", exc)
                    else:
                        # 文件被删除，清理当前会话
                        LOGGER.info("会话文件被删除，清理当前会话状态")
                        self.mi_account = None
                        self.mina_service = None
                        self._devices_cache.clear()
            except Exception:
                # 忽略单次检查的异常，继续下一轮
                pass

    async def start_session_file_watcher(self) -> None:
        if self._watch_task is not None and not self._watch_task.done():
            return
        self._stop_watch_event = asyncio.Event()
        self._watch_task = asyncio.create_task(self._watch_session_file())

    async def stop_session_file_watcher(self) -> None:
        if self._stop_watch_event is not None:
            self._stop_watch_event.set()
        if self._watch_task is not None:
            try:
                await asyncio.wait_for(self._watch_task, timeout=2.0)
            except Exception:
                pass
            finally:
                self._watch_task = None
                self._stop_watch_event = None

    async def login(self, username: Optional[str], password: Optional[str]) -> None:
        async with self._lock:
            if self.http_session is None:
                raise HTTPException(status_code=500, detail="HTTP 会话未初始化")
            if not username or not password:
                raise HTTPException(status_code=400, detail="请提供小米账号与密码")
            account = MiAccount(self.http_session, username, password, self.token_path)
            ok = await account.login("micoapi")
            if not ok:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="小米账号登录失败")
            self.mi_account = account
            self.mina_service = MiNAService(account)
            self._devices_cache.clear()

    async def logout(self) -> None:
        async with self._lock:
            self.mi_account = None
            self.mina_service = None
            self._devices_cache.clear()
            # 删除会话文件
            try:
                import os
                if os.path.exists(self.token_path):
                    os.remove(self.token_path)
            except Exception:
                pass

    async def ensure_mina(self) -> MiNAService:
        if not self.mina_service:
            raise HTTPException(status_code=401, detail="请先登录小米账号")
        return self.mina_service

    async def device_list(self) -> List[Dict[str, Any]]:
        # TTL 缓存：key 固定，过期自动刷新
        devices = self._devices_cache.get("devices")
        if devices is not None:
            return devices
        mina = await self.ensure_mina()
        devices = await mina.device_list() or []
        self._devices_cache["devices"] = devices
        return devices

    async def resolve_device_id(self, selector: str) -> str:
        devices = await self.device_list()
        if not selector:
            if not devices:
                raise HTTPException(status_code=400, detail="没有可用设备")
            return devices[0].get("deviceID")
        # 1) 直接是 deviceID
        if "-" in selector and any(d.get("deviceID") == selector for d in devices):
            return selector
        # 2) 纯数字 miotDID
        if selector.isdigit():
            for d in devices:
                if str(d.get("miotDID")) == selector:
                    return d.get("deviceID")
        # 3) 名称/别名
        for d in devices:
            if d.get("alias") == selector or d.get("name") == selector:
                return d.get("deviceID")
        raise HTTPException(status_code=400, detail=f"未找到匹配的设备: {selector}")


