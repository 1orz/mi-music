import { ReactNode } from 'react';
import { Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/pages/Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  // 登录成功回调：重新检查认证状态并跳转到主页
  const handleLoginSuccess = async () => {
    await checkAuth();
    // 登录成功后跳转到主页
    window.history.pushState(null, '', '/');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 确保未认证时URL显示为登录页面
    if (window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return <>{children}</>;
};
