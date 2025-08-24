import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider, App, Grid } from 'antd';
import { UserOutlined, LockOutlined, WifiOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useXiaomi } from '@/hooks/useXiaomi';
import type { SystemLoginRequest, XiaomiLoginRequest } from '@/types/api';

const { Title, Text } = Typography;

interface LoginPageProps {
  onLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { message } = App.useApp();
  const [systemForm] = Form.useForm<SystemLoginRequest>();
  const [xiaomiForm] = Form.useForm<XiaomiLoginRequest>();
  const [activeStep, setActiveStep] = useState<'system' | 'xiaomi'>('system');
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  
  const { login: systemLogin, isLoading: systemLoading, isAuthenticated } = useAuth();
  const { xiaomiLogin, isLoading: xiaomiLoading, xiaomiStatus, checkXiaomiStatus } = useXiaomi();

  // 系统登录提交
  const handleSystemLogin = async (values: SystemLoginRequest) => {
    try {
      await systemLogin(values);
      // 登录系统成功后自动检测小米登录状态
      await checkXiaomiStatus();
      if (xiaomiStatus.logged_in) {
        message.success('系统登录成功，已检测到小米账号登录，直接进入控制台');
        onLogin?.();
      } else {
        message.success('系统登录成功，请继续登录小米账号');
        setActiveStep('xiaomi');
      }
    } catch (error) {
      console.error('系统登录失败:', error);
    }
  };

  // 小米账号登录提交
  const handleXiaomiLogin = async (values: XiaomiLoginRequest) => {
    try {
      await xiaomiLogin(values);
      onLogin?.();
    } catch (error) {
      console.error('小米账号登录失败:', error);
    }
  };

  // 跳过小米登录
  const handleSkipXiaomi = () => {
    onLogin?.();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: screens.xs ? '16px' : '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: screens.xs ? 350 : 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
        bodyStyle={{
          padding: screens.xs ? '20px 16px' : '24px'
        }}
      >
        <Space 
          direction="vertical" 
          size={screens.xs ? 'middle' : 'large'} 
          style={{ width: '100%' }}
        >
          <div style={{ textAlign: 'center' }}>
            <WifiOutlined style={{ 
              fontSize: screens.xs ? 36 : 48, 
              color: '#1890ff', 
              marginBottom: screens.xs ? 12 : 16 
            }} />
            <Title 
              level={screens.xs ? 3 : 2} 
              style={{ margin: 0, fontSize: screens.xs ? '20px' : undefined }}
            >
              小米音响控制台
            </Title>
            <Text type="secondary" style={{ fontSize: screens.xs ? '13px' : '14px' }}>
              智能音响远程控制系统
            </Text>
          </div>

          {/* 系统登录 */}
          {!isAuthenticated && (
            <>
              <Divider>系统登录</Divider>
              <Form
                form={systemForm}
                onFinish={handleSystemLogin}
                layout="vertical"
                size={screens.xs ? 'middle' : 'large'}
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={systemLoading}
                    block
                  >
                    登录系统
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* 小米账号登录 */}
          {isAuthenticated && activeStep === 'xiaomi' && !xiaomiStatus.logged_in && (
            <>
              <Divider>小米账号登录</Divider>
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                需要登录小米账号以控制设备
              </Text>
              
                                <Form
                    form={xiaomiForm}
                    onFinish={handleXiaomiLogin}
                    layout="vertical"
                    size={screens.xs ? 'middle' : 'large'}
                  >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入小米账号' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="小米账号（手机号/邮箱）"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入小米密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="小米密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={xiaomiLoading}
                      block
                    >
                      登录小米账号
                    </Button>
                    <Button
                      type="text"
                      onClick={handleSkipXiaomi}
                      block
                    >
                      稍后登录
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}

          {/* 登录成功状态 */}
          {isAuthenticated && xiaomiStatus.logged_in && (
            <>
              <Divider>登录成功</Divider>
              <div style={{ textAlign: 'center' }}>
                <Text type="success">
                  已连接到 {xiaomiStatus.devices_count || 0} 台设备
                </Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={onLogin} 
                    block
                    size={screens.xs ? 'middle' : 'large'}
                  >
                    进入控制台
                  </Button>
                </div>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};
