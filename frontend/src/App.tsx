import { useState, useEffect } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from '@/components/Layout/MainLayout';
import { AppStateProvider } from '@/context/AppStateContext';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { DashboardPage } from '@/pages/Dashboard';
import { SettingsPage } from '@/pages/Settings';
import './styles/global.css';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // 根据URL路径设置当前页面
  const updatePageFromURL = () => {
    const path = window.location.pathname;
    if (path === '/settings') {
      setCurrentPage('settings');
    } else if (path === '/' || path === '/login') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('dashboard'); // 默认页面
    }
  };

  // 初始化页面状态和监听浏览器导航
  useEffect(() => {
    updatePageFromURL();

    // 监听浏览器后退/前进按钮
    const handlePopState = () => {
      updatePageFromURL();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 页面切换时同步更新URL
  const handleMenuSelect = (page: string) => {
    setCurrentPage(page);
    // 更新URL但不刷新页面
    const newPath = page === 'dashboard' ? '/' : `/${page}`;
    window.history.pushState(null, '', newPath);
  };

  // 根据选中的菜单项渲染对应页面
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        components: {
          Layout: {
            siderBg: '#001529',
            headerBg: '#ffffff',
          },
        },
      }}
    >
      <AntdApp>
        <AppStateProvider>
          <ProtectedRoute>
            <MainLayout
              selectedKey={currentPage}
              onMenuSelect={handleMenuSelect}
            >
              {renderPage()}
            </MainLayout>
          </ProtectedRoute>
        </AppStateProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;