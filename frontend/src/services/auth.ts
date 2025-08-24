import { request } from '@/utils/http';
import type {
  SystemLoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  TokenRefreshResponse,
  AuthStatus,
  ApiResponse,
} from '@/types/api';

// 系统认证服务
export const authService = {
  // 系统登录
  login: async (data: SystemLoginRequest): Promise<LoginResponse> => {
    return request.post<LoginResponse>('/auth/login', data);
  },

  // 刷新令牌
  refresh: async (data: RefreshTokenRequest): Promise<TokenRefreshResponse> => {
    return request.post<TokenRefreshResponse>('/auth/refresh', data);
  },

  // 查询登录状态
  status: async (): Promise<AuthStatus> => {
    return request.get<AuthStatus>('/auth/status');
  },

  // 登出（前端处理，清除本地存储）
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // 检查是否已认证
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },

  // 获取用户信息
  getUser: (): any => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 保存用户信息和令牌
  saveAuth: (loginResponse: LoginResponse): void => {
    if (loginResponse.access_token) {
      localStorage.setItem('accessToken', loginResponse.access_token);
    }
    if (loginResponse.refresh_token) {
      localStorage.setItem('refreshToken', loginResponse.refresh_token);
    }
    
    // 保存用户基本信息（从令牌中解析或存储）
    const userInfo = {
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('user', JSON.stringify(userInfo));
  },
};
