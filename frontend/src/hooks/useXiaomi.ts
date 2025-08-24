import { useAppState } from '@/context/AppStateContext';

export const useXiaomi = () => {
  const {
    xiaomiStatus,
    isLoading: _deprecatedLoading, // 兼容旧命名（若有使用）
    xiaomiLoading: isLoading,
    xiaomiLogin,
    xiaomiLogout,
    checkXiaomiStatus,
    updateStatusByDevices,
  } = useAppState() as unknown as any;

  return {
    xiaomiStatus,
    isLoading,
    xiaomiLogin,
    xiaomiLogout,
    checkXiaomiStatus,
    updateStatusByDevices,
  };
};
