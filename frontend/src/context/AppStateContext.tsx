import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { xiaomiService } from '@/services/xiaomi';
import { deviceService } from '@/services/device';
import type { XiaomiAccountStatus, XiaomiLoginRequest, DeviceInfo, ApiResponse } from '@/types/api';

interface AppStateContextValue {
  // 小米状态
  xiaomiStatus: XiaomiAccountStatus;
  setXiaomiStatus: React.Dispatch<React.SetStateAction<XiaomiAccountStatus>>;
  xiaomiLoading: boolean;
  checkXiaomiStatus: () => Promise<ApiResponse<XiaomiAccountStatus> | void>;
  xiaomiLogin: (loginData: XiaomiLoginRequest) => Promise<ApiResponse | void>;
  xiaomiLogout: () => Promise<ApiResponse | void>;
  updateStatusByDevices: (devicesCount: number) => void;

  // 设备状态
  devices: DeviceInfo[];
  setDevices: React.Dispatch<React.SetStateAction<DeviceInfo[]>>;
  devicesLoading: boolean;
  fetchDevices: () => Promise<DeviceInfo[] | void>;
  selectedDevice: DeviceInfo | null;
  setSelectedDevice: React.Dispatch<React.SetStateAction<DeviceInfo | null>>;
  selectDevice: (device: DeviceInfo) => void;
  getDeviceSelector: (device?: DeviceInfo | null) => string;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从 localStorage 恢复小米状态
  const initialXiaomi: XiaomiAccountStatus = (() => {
    try {
      const cached = localStorage.getItem('xiaomiStatus');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { logged_in: false, devices_count: 0 };
  })();

  const [xiaomiStatus, setXiaomiStatus] = useState<XiaomiAccountStatus>(initialXiaomi);
  const [xiaomiLoading, setXiaomiLoading] = useState<boolean>(false);

  const checkXiaomiStatus = useCallback(async () => {
    setXiaomiLoading(true);
    try {
      const response = await xiaomiService.status();
      if (response.success && response.data) {
        setXiaomiStatus(response.data);
        localStorage.setItem('xiaomiStatus', JSON.stringify(response.data));
      }
      return response;
    } catch (error: any) {
      console.error('检查小米账号状态失败:', error);
      message.error(error.response?.data?.detail || '检查小米账号状态失败');
      setXiaomiStatus({ logged_in: false });
      localStorage.removeItem('xiaomiStatus');
    } finally {
      setXiaomiLoading(false);
    }
  }, []);

  const xiaomiLogin = useCallback(async (loginData: XiaomiLoginRequest) => {
    if (!loginData.username || !loginData.password) {
      message.error('请输入小米账号和密码');
      return;
    }
    setXiaomiLoading(true);
    try {
      const response = await xiaomiService.login(loginData);
      if (response.success) {
        message.success(response.message || '小米账号登录成功');
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
      setXiaomiLoading(false);
    }
  }, [checkXiaomiStatus]);

  const xiaomiLogout = useCallback(async () => {
    setXiaomiLoading(true);
    try {
      const response = await xiaomiService.logout();
      if (response.success) {
        message.success(response.message || '小米账号已登出');
        setXiaomiStatus({ logged_in: false });
        localStorage.removeItem('xiaomiStatus');
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
      setXiaomiLoading(false);
    }
  }, []);

  const updateStatusByDevices = useCallback((devicesCount: number) => {
    setXiaomiStatus((prev) => {
      const next = {
        ...prev,
        logged_in: devicesCount > 0,
        devices_count: devicesCount,
      };
      // 仅在变化时写入
      if (prev.logged_in !== next.logged_in || prev.devices_count !== next.devices_count) {
        try { localStorage.setItem('xiaomiStatus', JSON.stringify(next)); } catch {}
        return next;
      }
      return prev;
    });
  }, []);

  // Provider 挂载时自动检查后台登录状态，确保刷新在任何路由下都可正确获取
  useEffect(() => {
    checkXiaomiStatus();
  }, [checkXiaomiStatus]);

  // 设备
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [devicesLoading, setDevicesLoading] = useState<boolean>(false);
  const isFetchingDevicesRef = useRef<boolean>(false);
  const devicesHashRef = useRef<string>('');

  const fetchDevices = useCallback(async () => {
    if (isFetchingDevicesRef.current) return; // 并发去重
    isFetchingDevicesRef.current = true;
    setDevicesLoading(true);
    try {
      const response = await deviceService.getDevices();
      if (response.success && response.data) {
        const list = response.data;
        const newHash = JSON.stringify(list.map(d => [d.deviceID, d.alias, d.name, d.hardware]));
        const changed = newHash !== devicesHashRef.current;
        if (changed) {
          devicesHashRef.current = newHash;
          setDevices(list);
          // 确保有选中的设备
          if (list.length > 0) {
            setSelectedDevice((prev) => {
              if (!prev || !list.find(d => d.deviceID === prev.deviceID)) {
                return list[0];
              }
              return prev;
            });
          } else {
            setSelectedDevice(null);
          }
        }
        // 同步登录状态（无论列表是否变化，都按数量修正一次，但内部仅在变化时 setState）
        updateStatusByDevices(list.length);
        return list;
      } else {
        message.error(response.message || '获取设备列表失败');
        setDevices([]);
        devicesHashRef.current = '';
      }
    } catch (error: any) {
      console.error('获取设备列表失败:', error);
      message.error(error.response?.data?.detail || error.message || '获取设备列表失败');
      setDevices([]);
      devicesHashRef.current = '';
    } finally {
      setDevicesLoading(false);
      isFetchingDevicesRef.current = false;
    }
  }, [updateStatusByDevices]);

  const selectDevice = useCallback((device: DeviceInfo) => {
    setSelectedDevice(device);
    localStorage.setItem('selectedDevice', JSON.stringify(device));
  }, []);

  const getDeviceSelector = useCallback((device?: DeviceInfo | null) => {
    const targetDevice = device ?? selectedDevice;
    if (!targetDevice) return '';
    return targetDevice.alias || targetDevice.name || targetDevice.deviceID;
  }, [selectedDevice]);

  // 初始化恢复选中的设备
  useEffect(() => {
    const savedDevice = localStorage.getItem('selectedDevice');
    if (savedDevice) {
      try {
        const device = JSON.parse(savedDevice);
        setSelectedDevice(device);
      } catch (error) {
        console.error('恢复选中设备失败:', error);
      }
    }
  }, []);

  const value = useMemo<AppStateContextValue>(() => ({
    // 小米
    xiaomiStatus,
    setXiaomiStatus,
    xiaomiLoading,
    checkXiaomiStatus,
    xiaomiLogin,
    xiaomiLogout,
    updateStatusByDevices,

    // 设备
    devices,
    setDevices,
    devicesLoading,
    fetchDevices,
    selectedDevice,
    setSelectedDevice,
    selectDevice,
    getDeviceSelector,
  }), [
    xiaomiStatus,
    xiaomiLoading,
    checkXiaomiStatus,
    xiaomiLogin,
    xiaomiLogout,
    updateStatusByDevices,
    devices,
    devicesLoading,
    fetchDevices,
    selectedDevice,
    selectDevice,
    getDeviceSelector,
  ]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextValue => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
};
