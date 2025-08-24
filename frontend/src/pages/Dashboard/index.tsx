import { useEffect, useState } from 'react';
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
  const { checkXiaomiStatus, updateStatusByDevices } = useXiaomi();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const [refreshSignal, setRefreshSignal] = useState(0);

  // 播放状态变化时刷新设备状态
  const handlePlaybackChange = () => {
    // 触发左侧设备状态刷新（播放状态/音量等）
    setRefreshSignal((x) => x + 1);
  };

  // 页面加载时检查状态并获取设备列表
  useEffect(() => {
    const initializeData = async () => {
      // 首先尝试获取设备列表（更直接的小米登录状态判断）
      try {
        await fetchDevices();
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        // 如果获取设备失败，再检查小米账号状态
        await checkXiaomiStatus();
      }
    };
    
    initializeData();
  }, [fetchDevices, checkXiaomiStatus]);

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
        <Title level={screens.xs ? 3 : 2}>小米音响控制台 - 设备管理</Title>
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
            <DeviceStatus device={selectedDevice} refreshSignal={refreshSignal} />
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
