import { request } from '@/utils/http';
import type {
  XiaomiLoginRequest,
  XiaomiAccountStatus,
  ApiResponse,
} from '@/types/api';

// 小米账号服务
export const xiaomiService = {
  // 小米账号登录
  login: async (data: XiaomiLoginRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/account/login', data);
  },

  // 小米账号登出
  logout: async (): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/account/logout');
  },

  // 查询小米账号登录状态
  status: async (): Promise<ApiResponse<XiaomiAccountStatus>> => {
    return request.get<ApiResponse<XiaomiAccountStatus>>('/mi/account/status');
  },
};
