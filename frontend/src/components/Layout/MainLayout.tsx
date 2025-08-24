import { useState, ReactNode, useMemo } from 'react';
import { 
  Layout, 
  Menu, 
  Button, 
  Space, 
  Dropdown, 
  Avatar, 
  Typography,
  Badge,
  Alert,
  Drawer,
  Grid
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useXiaomi } from '@/hooks/useXiaomi';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: ReactNode;
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  selectedKey = 'dashboard',
  onMenuSelect
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { xiaomiStatus, xiaomiLogout } = useXiaomi();
  
  // 响应式断点
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  const menuItems = useMemo(() => ([
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    }
  ]), []);

  // 顶部标题跟随当前激活菜单
  const currentTitle = useMemo(() => {
    const item = menuItems.find(i => i.key === selectedKey);
    return (item?.label as string) || '';
  }, [selectedKey, menuItems]);

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuSelect?.(key);
    // 移动端选择菜单后关闭抽屉
    if (!screens.lg) {
      setMobileDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (xiaomiStatus.logged_in) {
        await xiaomiLogout();
      }
    } catch (error) {
      console.error('小米账号登出失败:', error);
    }
    logout();
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '用户信息',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    }
  ];

  // 侧边栏内容组件
  const SiderContent = () => (
    <>
      <div style={{ height: '64px', padding: '16px', display: 'flex', alignItems: 'center' }}>
        {!collapsed && (
          <Text style={{ color: '#fff', fontWeight: 600 }}>小米音响控制台</Text>
        )}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {screens.lg && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={168} collapsedWidth={56}>
          <SiderContent />
        </Sider>
      )}
      
      {/* 移动端抽屉导航 */}
      {!screens.lg && (
        <Drawer
          title="菜单"
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          styles={{
            body: { padding: 0, background: '#001529' },
            header: { background: '#001529', borderBottom: '1px solid #303030' }
          }}
        >
          <SiderContent />
        </Drawer>
      )}
      
      <Layout>
        <Header style={{ 
          padding: screens.xs ? '0 16px' : '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Space size="middle">
            <Button
              type="text"
              icon={screens.lg ? (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />) : <MenuFoldOutlined />}
              onClick={() => screens.lg ? setCollapsed(!collapsed) : setMobileDrawerOpen(true)}
              size={screens.xs ? 'middle' : 'large'}
            />
            
            {!screens.xs && (
              <div>
                <Text strong style={{ fontSize: screens.md ? '16px' : '14px' }}>
                  {currentTitle}
                </Text>
              </div>
            )}
          </Space>

          <Space size={screens.xs ? 'small' : 'middle'}>
            {/* 移动端简化状态显示 */}
            {screens.xs ? (
              <Badge 
                status={xiaomiStatus.logged_in ? 'success' : 'error'}
                title={xiaomiStatus.logged_in ? '小米已连接' : '小米未连接'}
              />
            ) : (
              <Badge 
                status={xiaomiStatus.logged_in ? 'success' : 'error'}
                text={screens.sm ? (xiaomiStatus.logged_in ? '小米已连接' : '小米未连接') : ''}
              />
            )}
            
            {/* 用户下拉菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={screens.xs ? 'small' : 'default'} icon={<UserOutlined />} />
                {!screens.xs && <Text>{user?.username || '用户'}</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: screens.xs ? '16px 8px' : '24px 16px', 
          padding: screens.xs ? 16 : 24, 
          background: '#fff',
          borderRadius: '6px'
        }}>
          {/* 小米账号未登录提醒 */}
          {!xiaomiStatus.logged_in && (
            <Alert
              message="小米账号未登录"
              description="部分功能需要登录小米账号才能使用，请在设置页面中登录。"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
