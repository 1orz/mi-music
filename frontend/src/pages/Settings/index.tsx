import { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Row,
  Col,
  Alert,
  Badge
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  WifiOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useXiaomi } from '@/hooks/useXiaomi';
import type { XiaomiLoginRequest } from '@/types/api';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    xiaomiStatus, 
    xiaomiLogin, 
    xiaomiLogout, 
    isLoading: xiaomiLoading 
  } = useXiaomi();
  
  const [xiaomiForm] = Form.useForm<XiaomiLoginRequest>();

  // 小米账号登录
  const handleXiaomiLogin = async (values: XiaomiLoginRequest) => {
    try {
      await xiaomiLogin(values);
      xiaomiForm.resetFields();
    } catch (error) {
      console.error('小米账号登录失败:', error);
    }
  };

  // 小米账号登出
  const handleXiaomiLogout = async () => {
    try {
      await xiaomiLogout();
    } catch (error) {
      console.error('小米账号登出失败:', error);
    }
  };

  // 系统登出
  const handleSystemLogout = () => {
    logout();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>小米音响控制台 - 设置</Title>
      </div>

      <Row gutter={[16, 16]}>
        {/* 系统账号信息 */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <UserOutlined />
              系统账号
            </Space>
          }>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>用户名：</Text>
                <Text>{user?.username || '未知用户'}</Text>
              </div>
              
              <div>
                <Text strong>登录状态：</Text>
                <Badge status="success" text="已登录" />
              </div>
              
              <div>
                <Text strong>登录时间：</Text>
                <Text type="secondary">
                  {user?.loginTime ? new Date(user.loginTime).toLocaleString() : '未知'}
                </Text>
              </div>

              <Divider />
              
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={handleSystemLogout}
                block
              >
                退出系统登录
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 小米账号管理 */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <WifiOutlined />
              小米账号
            </Space>
          }>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 登录状态显示 */}
              <div>
                <Text strong>连接状态：</Text>
                <Badge 
                  status={xiaomiStatus.logged_in ? 'success' : 'error'}
                  text={xiaomiStatus.logged_in ? '已连接' : '未连接'}
                />
              </div>
              
              {/* 已登录时展示基础 ID 信息 */}
              {xiaomiStatus.logged_in && xiaomiStatus.user_id && (
                <div>
                  <Text strong>User ID：</Text>
                  <Text code>{xiaomiStatus.user_id}</Text>
                </div>
              )}

              {xiaomiStatus.logged_in && xiaomiStatus.devices_count !== undefined && (
                <div>
                  <Text strong>设备数量：</Text>
                  <Text>{xiaomiStatus.devices_count} 台</Text>
                </div>
              )}

              <Divider />

              {/* 小米账号登录/登出 */}
              {!xiaomiStatus.logged_in ? (
                <>
                  <Alert
                    message="需要登录小米账号"
                    description="登录小米账号后才能控制设备，请输入您的小米账号和密码。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Form
                    form={xiaomiForm}
                    onFinish={handleXiaomiLogin}
                    layout="vertical"
                  >
                    <Form.Item
                      name="username"
                      label="小米账号"
                      rules={[{ required: true, message: '请输入小米账号' }]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="手机号或邮箱"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label="密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="小米账号密码"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={xiaomiLoading}
                        block
                        size="large"
                      >
                        登录小米账号
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              ) : (
                <>
                  <Alert
                    message="小米账号已连接"
                    description="您可以正常使用所有设备控制功能。"
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Button
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleXiaomiLogout}
                    loading={xiaomiLoading}
                    block
                    size="large"
                  >
                    断开小米账号
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="使用说明" size="small">
        <Space direction="vertical" size="small">
          <Text>
            <Text strong>1. 系统登录：</Text>
            使用管理员配置的用户名密码登录系统。
          </Text>
          <Text>
            <Text strong>2. 小米账号：</Text>
            登录您的小米账号以获取设备列表和控制权限。
          </Text>
          <Text>
            <Text strong>3. 设备控制：</Text>
            在控制台页面选择设备并进行播放控制、音量调节、语音播报等操作。
          </Text>
          <Text>
            <Text strong>4. 安全提示：</Text>
            请妥善保管您的账号信息，不要在公共设备上保存密码。
          </Text>
        </Space>
      </Card>
    </Space>
  );
};
