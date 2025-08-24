import { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Form, 
  Slider, 
  Row, 
  Col,
  Typography 
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SoundOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { playerService } from '@/services/player';
import { useDevices } from '@/hooks/useDevices';
import type { PlayUrlRequest, VolumeRequest } from '@/types/api';

const { Text } = Typography;

interface PlayerControlsProps {
  onPlaybackChange?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onPlaybackChange
}) => {
  const { selectedDevice, getDeviceSelector } = useDevices();
  const message = useMessage();
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [volume, setVolume] = useState(50);
  const [urlForm] = Form.useForm();

  const deviceSelector = getDeviceSelector();

  const setLoading = (key: string, loading: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: loading }));
  };

  // 播放URL
  const handlePlayUrl = async (values: { url: string; type?: number }) => {
    if (!deviceSelector) {
      message.error('请先选择设备');
      return;
    }

    setLoading('playUrl', true);
    try {
      const playData: PlayUrlRequest = {
        device_selector: deviceSelector,
        url: values.url,
        type: values.type || 2
      };

      const response = await playerService.playUrl(playData);
      
      if (response.success) {
        message.success('播放命令已发送');
        onPlaybackChange?.();
      } else {
        message.error(response.message || '播放失败');
      }
    } catch (error: any) {
      console.error('播放失败:', error);
      message.error(error.response?.data?.detail || error.message || '播放失败');
    } finally {
      setLoading('playUrl', false);
    }
  };

  // 播放控制（播放/暂停/停止）
  const handlePlaybackControl = async (action: 'play' | 'pause' | 'stop') => {
    if (!deviceSelector) {
      message.error('请先选择设备');
      return;
    }

    setLoading(action, true);
    try {
      const controlData = { device_selector: deviceSelector };
      let response;

      switch (action) {
        case 'play':
          response = await playerService.play(controlData);
          break;
        case 'pause':
          response = await playerService.pause(controlData);
          break;
        case 'stop':
          response = await playerService.stop(controlData);
          break;
      }

      if (response.success) {
        message.success(response.message || `${action} 命令已发送`);
        onPlaybackChange?.();
      } else {
        message.error(response.message || `${action} 失败`);
      }
    } catch (error: any) {
      console.error(`${action} 失败:`, error);
      message.error(error.response?.data?.detail || error.message || `${action} 失败`);
    } finally {
      setLoading(action, false);
    }
  };

  // 设置音量
  const handleVolumeChange = async (newVolume: number) => {
    if (!deviceSelector) {
      message.error('请先选择设备');
      return;
    }

    setLoading('volume', true);
    try {
      const volumeData: VolumeRequest = {
        device_selector: deviceSelector,
        volume: newVolume
      };

      const response = await playerService.setVolume(volumeData);
      
      if (response.success) {
        setVolume(newVolume);
        message.success(`音量已设置为 ${newVolume}%`);
      } else {
        message.error(response.message || '设置音量失败');
      }
    } catch (error: any) {
      console.error('设置音量失败:', error);
      message.error(error.response?.data?.detail || error.message || '设置音量失败');
    } finally {
      setLoading('volume', false);
    }
  };

  if (!selectedDevice) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <PlayCircleOutlined style={{ fontSize: '24px', color: '#ccc' }} />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">请先选择设备以开始播放控制</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* URL 播放 */}
      <Card size="small" title={
        <Space>
          <LinkOutlined />
          播放链接
        </Space>
      }>
        <Form
          form={urlForm}
          onFinish={handlePlayUrl}
          layout="vertical"
        >
          <Form.Item
            name="url"
            rules={[
              { required: true, message: '请输入播放链接' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input
              placeholder="输入音频/视频链接，如：https://example.com/music.mp3"
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading.playUrl}
              block
              icon={<PlayCircleOutlined />}
            >
              播放链接
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 播放控制 */}
      <Card size="small" title="播放控制">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handlePlaybackControl('play')}
              loading={isLoading.play}
              block
              size="large"
            >
              播放
            </Button>
          </Col>
          <Col span={8}>
            <Button
              icon={<PauseCircleOutlined />}
              onClick={() => handlePlaybackControl('pause')}
              loading={isLoading.pause}
              block
              size="large"
            >
              暂停
            </Button>
          </Col>
          <Col span={8}>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => handlePlaybackControl('stop')}
              loading={isLoading.stop}
              block
              size="large"
            >
              停止
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 音量控制 */}
      <Card 
        size="small" 
        title={
          <Space>
            <SoundOutlined />
            音量控制
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text style={{ minWidth: '60px' }}>音量: {volume}%</Text>
            <Slider
              style={{ flex: 1 }}
              min={0}
              max={100}
              value={volume}
              onChange={setVolume}
              onAfterChange={handleVolumeChange}
              disabled={isLoading.volume}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[0, 25, 50, 75, 100].map(vol => (
              <Button
                key={vol}
                size="small"
                type={volume === vol ? 'primary' : 'default'}
                onClick={() => {
                  setVolume(vol);
                  handleVolumeChange(vol);
                }}
                disabled={isLoading.volume}
              >
                {vol}%
              </Button>
            ))}
          </div>
        </Space>
      </Card>
    </Space>
  );
};
