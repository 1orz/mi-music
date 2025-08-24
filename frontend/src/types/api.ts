// API 响应相关类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 系统认证相关类型
export interface SystemLoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  masked_account?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_expires_in?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_expires_in?: number;
}

export interface AuthStatus {
  detail: string;
  user: string;
  should_refresh: boolean;
}

// 小米账号相关类型
export interface XiaomiLoginRequest {
  username?: string;
  password?: string;
}

export interface XiaomiAccountStatus {
  logged_in: boolean;
  devices_count?: number;
  user_id?: string;
}

// 设备相关类型
export interface DeviceInfo {
  deviceID: string;
  name?: string;
  alias?: string;
  miotDID?: string;
  hardware?: string;
  capabilities?: Record<string, any>;
}

// 播放控制相关类型
export interface PlayUrlRequest {
  device_selector: string;
  url: string;
  type?: number;
}

export interface VolumeRequest {
  device_selector: string;
  volume: number;
}

export interface TTSRequest {
  device_selector: string;
  text: string;
}

export interface PlayControlRequest {
  device_selector: string;
}

// 播放状态相关类型
export interface PlaybackStatus {
  status: any;
  device_id: string;
}

export interface VolumeInfo {
  volume: number;
  device_id: string;
}

// 前端应用状态类型
export interface User {
  username: string;
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface AppState {
  user: User | null;
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  xiaomiLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}
