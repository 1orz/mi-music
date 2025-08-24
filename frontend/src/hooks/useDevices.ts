import { useState, useCallback, useEffect } from 'react';
import { useMessage } from './useMessage';
import { deviceService } from '@/services/device';
import type { DeviceInfo } from '@/types/api';

export const useDevices = () => {
  const message = useMessage();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await deviceService.getDevices();
      
      if (response.success && response.data) {
        setDevices(response.data);
        
        // 总是确保有选中的设备
        if (response.data.length > 0) {
          // 如果当前没有选中设备，或者选中的设备不在新的列表中，选中第一个
          if (!selectedDevice || !response.data.find(d => d.deviceID === selectedDevice.deviceID)) {
            setSelectedDevice(response.data[0]);
          }
        } else {
          // 如果没有设备，清除选中状态
          setSelectedDevice(null);
        }
        
        return response.data;
      } else {
        message.error(response.message || '获取设备列表失败');
        setDevices([]);
      }
    } catch (error: any) {
      console.error('获取设备列表失败:', error);
      message.error(error.response?.data?.detail || error.message || '获取设备列表失败');
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice]);

  // 选择设备
  const selectDevice = useCallback((device: DeviceInfo) => {
    setSelectedDevice(device);
    // 可以在这里保存到 localStorage
    localStorage.setItem('selectedDevice', JSON.stringify(device));
  }, []);

  // 根据选择器获取设备ID
  const getDeviceSelector = useCallback((device: DeviceInfo | null = null): string => {
    const targetDevice = device || selectedDevice;
    if (!targetDevice) return '';
    
    // 优先使用 alias，其次是 name，最后是 deviceID
    return targetDevice.alias || targetDevice.name || targetDevice.deviceID;
  }, [selectedDevice]);

  // 初始化时从 localStorage 恢复选中的设备
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

  return {
    devices,
    selectedDevice,
    isLoading,
    fetchDevices,
    selectDevice,
    getDeviceSelector,
  };
};
