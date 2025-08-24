import { useEffect } from 'react';
import { Row, Col, Typography, Space, Grid } from 'antd';
import { DeviceSelector } from '@/components/Device/DeviceSelector';
import { DeviceStatus } from '@/components/Device/DeviceStatus';
import { PlayerControls } from '@/components/Player/PlayerControls';
import { TTSControl } from '@/components/Player/TTSControl';
import { useDevices } from '@/hooks/useDevices';
import { useXiaomi } from '@/hooks/useXiaomi';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  const { selectedDevice, fetchDevices, devices } = useDevices();
  const { xiaomiStatus, checkXiaomiStatus, updateStatusByDevices } = useXiaomi();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  // 播放状态变化时刷新设备状态
  const handlePlaybackChange = () => {
    // 这里可以添加刷新播放状态的逻辑
  };

  // 页面加载时检查状态并获取设备列表
  useEffect(() => {
    const initializeData = async () => {
      // 首先尝试获取设备列表（更直接的小米登录状态判断）
      try {
        await fetchDevices();
      } catch (error) {
        // 如果获取设备失败，再检查小米账号状态
        await checkXiaomiStatus();
      }
    };
    
    initializeData();
  }, []);

  // 基于设备数据同步小米登录状态
  useEffect(() => {
    if (devices.length > 0) {
      updateStatusByDevices(devices.length);
    }
  }, [devices.length, updateStatusByDevices]);

  return (
    <Space 
      direction="vertical" 
      size={screens.xs ? 'middle' : 'large'} 
      style={{ width: '100%' }}
    >
      <div>
        <Title level={screens.xs ? 3 : 2}>控制台</Title>
      </div>

      <Row gutter={[
        screens.xs ? 8 : screens.sm ? 12 : 16, 
        screens.xs ? 8 : screens.sm ? 12 : 16
      ]}>
        {/* 设备管理区域 */}
        <Col 
          xs={24} 
          sm={24} 
          md={24} 
          lg={10} 
          xl={10}
          xxl={8}
        >
          <Space 
            direction="vertical" 
            size={screens.xs ? 'small' : 'middle'} 
            style={{ width: '100%' }}
          >
            <DeviceSelector 
              value={selectedDevice}
              onChange={() => {
                // DeviceSelector内部已经处理了设备选择，这里主要用于外部状态同步
              }}
            />
            <DeviceStatus device={selectedDevice} />
          </Space>
        </Col>

        {/* 播放控制区域 */}
        <Col 
          xs={24} 
          sm={24} 
          md={24} 
          lg={14} 
          xl={14}
          xxl={16}
        >
          <Space 
            direction="vertical" 
            size={screens.xs ? 'small' : 'middle'} 
            style={{ width: '100%' }}
          >
            <PlayerControls onPlaybackChange={handlePlaybackChange} />
            <TTSControl onTTSComplete={handlePlaybackChange} />
          </Space>
        </Col>
      </Row>
    </Space>
  );
};
