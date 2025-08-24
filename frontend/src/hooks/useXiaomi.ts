import { useState, useCallback } from 'react';
import { message } from 'antd';
import { xiaomiService } from '@/services/xiaomi';
import type { XiaomiLoginRequest, XiaomiAccountStatus } from '@/types/api';

export const useXiaomi = () => {
  const [xiaomiStatus, setXiaomiStatus] = useState<XiaomiAccountStatus>({
    logged_in: false,
    devices_count: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 检查小米账号状态
  const checkXiaomiStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await xiaomiService.status();
      if (response.success && response.data) {
        setXiaomiStatus(response.data);
      }
      return response;
    } catch (error: any) {
      console.error('检查小米账号状态失败:', error);
      message.error(error.response?.data?.detail || '检查小米账号状态失败');
      setXiaomiStatus({ logged_in: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 小米账号登录
  const xiaomiLogin = useCallback(async (loginData: XiaomiLoginRequest) => {
    if (!loginData.username || !loginData.password) {
      message.error('请输入小米账号和密码');
      return;
    }

    setIsLoading(true);
    try {
      const response = await xiaomiService.login(loginData);
      
      if (response.success) {
        message.success(response.message || '小米账号登录成功');
        // 登录成功后重新检查状态
        await checkXiaomiStatus();
        return response;
      } else {
        message.error(response.message || '小米账号登录失败');
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('小米账号登录失败:', error);
      message.error(error.response?.data?.detail || error.message || '小米账号登录失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [checkXiaomiStatus]);

  // 小米账号登出
  const xiaomiLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await xiaomiService.logout();
      
      if (response.success) {
        message.success(response.message || '小米账号已登出');
        setXiaomiStatus({ logged_in: false });
        return response;
      } else {
        message.error(response.message || '小米账号登出失败');
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('小米账号登出失败:', error);
      message.error(error.response?.data?.detail || error.message || '小米账号登出失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    xiaomiStatus,
    isLoading,
    xiaomiLogin,
    xiaomiLogout,
    checkXiaomiStatus,
  };
};
