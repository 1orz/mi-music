import { useState, useEffect } from 'react';
import { Card, Descriptions, Badge, Button, Space, Spin, Typography } from 'antd';
import { 
  SoundOutlined, 
  ReloadOutlined, 
  WifiOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { playerService } from '@/services/player';
import { useDevices } from '@/hooks/useDevices';
import type { DeviceInfo } from '@/types/api';

const { Text } = Typography;

interface DeviceStatusProps {
  device?: DeviceInfo | null;
}

export const DeviceStatus: React.FC<DeviceStatusProps> = ({ device }) => {
  const { selectedDevice, getDeviceSelector } = useDevices();
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);
  const [volume, setVolume] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentDevice = device || selectedDevice;
  const deviceSelector = getDeviceSelector(currentDevice);

  // 获取播放状态
  const fetchPlaybackStatus = async () => {
    if (!deviceSelector) return;

    setIsLoading(true);
    try {
      const response = await playerService.getPlaybackStatus(deviceSelector);
      if (response.success && response.data) {
        setPlaybackStatus(response.data.status);
      }
    } catch (error) {
      console.error('获取播放状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取音量信息
  const fetchVolume = async () => {
    if (!deviceSelector) return;

    try {
      const response = await playerService.getVolume(deviceSelector);
      if (response.success && response.data) {
        setVolume(response.data.volume);
      }
    } catch (error) {
      console.error('获取音量失败:', error);
    }
  };

  // 刷新所有状态
  const handleRefresh = async () => {
    await Promise.all([
      fetchPlaybackStatus(),
      fetchVolume()
    ]);
  };

  // 当设备变化时重新获取状态
  useEffect(() => {
    if (currentDevice) {
      handleRefresh();
    }
  }, [currentDevice?.deviceID]);

  if (!currentDevice) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <SoundOutlined style={{ fontSize: '24px', color: '#ccc' }} />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">请先选择设备</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <SoundOutlined />
          设备状态
        </Space>
      }
      extra={
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={isLoading}
          title="刷新状态"
        />
      }
    >
      <Spin spinning={isLoading}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="设备名称">
            {currentDevice.alias || currentDevice.name || '未命名设备'}
          </Descriptions.Item>
          
          <Descriptions.Item label="硬件型号">
            {currentDevice.hardware || '未知'}
          </Descriptions.Item>
          
          <Descriptions.Item label="设备ID">
            <Text code style={{ fontSize: '12px' }}>
              {currentDevice.deviceID}
            </Text>
          </Descriptions.Item>
          
          {currentDevice.miotDID && (
            <Descriptions.Item label="MiOT ID">
              <Text code style={{ fontSize: '12px' }}>
                {currentDevice.miotDID}
              </Text>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="连接状态">
            <Badge status="success" text="在线" />
          </Descriptions.Item>
          
          {volume !== null && (
            <Descriptions.Item label="当前音量">
              <Space>
                <Text strong>{volume}%</Text>
                <div
                  style={{
                    width: 60,
                    height: 6,
                    background: '#f0f0f0',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${volume}%`,
                      height: '100%',
                      background: volume > 70 ? '#ff4d4f' : volume > 30 ? '#faad14' : '#52c41a',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </Space>
            </Descriptions.Item>
          )}
          
          {playbackStatus && (
            <Descriptions.Item label="播放状态">
              {(() => {
                try {
                  const info = typeof playbackStatus.info === 'string' 
                    ? JSON.parse(playbackStatus.info) 
                    : playbackStatus.info;
                  
                  const status = info?.status || 'unknown';
                  const statusMap: Record<string, { text: string; color: string }> = {
                    'playing': { text: '播放中', color: 'success' },
                    'paused': { text: '已暂停', color: 'warning' },
                    'stopped': { text: '已停止', color: 'default' },
                    'unknown': { text: '未知', color: 'default' }
                  };
                  
                  const statusInfo = statusMap[status] || statusMap['unknown'];
                  
                  return (
                    <Badge 
                      status={statusInfo.color as any} 
                      text={statusInfo.text}
                    />
                  );
                } catch {
                  return <Badge status="default" text="状态解析失败" />;
                }
              })()}
            </Descriptions.Item>
          )}
          
          {currentDevice.capabilities && (
            <Descriptions.Item label="设备能力">
              <Space wrap size="small">
                {Object.keys(currentDevice.capabilities).map(cap => (
                  <Badge key={cap} count={cap} showZero={false} />
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Spin>
    </Card>
  );
};
