import { useAppState } from '@/context/AppStateContext';

export const useDevices = () => {
  const {
    devices,
    selectedDevice,
    devicesLoading: isLoading,
    fetchDevices,
    selectDevice,
    getDeviceSelector,
  } = useAppState();

  return {
    devices,
    selectedDevice,
    isLoading,
    fetchDevices,
    selectDevice,
    getDeviceSelector,
  };
};
