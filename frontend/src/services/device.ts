import { request } from '@/utils/http';
import type {
  DeviceInfo,
  ApiResponse,
} from '@/types/api';

// 设备管理服务
export const deviceService = {
  // 获取设备列表
  getDevices: async (): Promise<ApiResponse<DeviceInfo[]>> => {
    return request.get<ApiResponse<DeviceInfo[]>>('/devices');
  },
};
