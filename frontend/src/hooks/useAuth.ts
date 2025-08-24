import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { authService } from '@/services/auth';
import type { SystemLoginRequest, LoginResponse } from '@/types/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { message } = App.useApp();

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const savedUser = authService.getUser();
        const status = await authService.status();
        setUser({ ...savedUser, username: status.user });
        setIsAuthenticated(true);
      } else {
        // 没有有效 token，设置为未认证状态
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登录
  const login = useCallback(async (loginData: SystemLoginRequest) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await authService.login(loginData);
      
      if (response.success) {
        authService.saveAuth(response);
        const savedUser = authService.getUser();
        setUser({ ...savedUser, username: loginData.username });
        setIsAuthenticated(true);
        message.success(response.message || '登录成功');
        return response;
      } else {
        message.error(response.message || '登录失败');
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.detail || error.message || '登录失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    message.success('已退出登录');
    // 退出登录后跳转到登录页面
    window.history.pushState(null, '', '/login');
  }, [message]);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };
};
