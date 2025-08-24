import { useState } from 'react';
import { Card, Input, Button, Space, Form, Typography, Divider } from 'antd';
import { SoundOutlined, SendOutlined } from '@ant-design/icons';
import { playerService } from '@/services/player';
import { useDevices } from '@/hooks/useDevices';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;
const { Text } = Typography;

interface TTSControlProps {
  onTTSComplete?: () => void;
}

export const TTSControl: React.FC<TTSControlProps> = ({
  onTTSComplete
}) => {
  const { selectedDevice, getDeviceSelector } = useDevices();
  const [isLoading, setIsLoading] = useState(false);
  const message = useMessage();
  const [form] = Form.useForm();

  const deviceSelector = getDeviceSelector();

  // 发送TTS请求
  const handleTTS = async (values: { text: string }) => {
    if (!deviceSelector) {
      message.error('请先选择设备');
      return;
    }

    if (!values.text?.trim()) {
      message.error('请输入要转换的文字');
      return;
    }

    setIsLoading(true);
    try {
      const ttsData = {
        device_selector: deviceSelector,
        text: values.text.trim()
      };

      const response = await playerService.tts(ttsData);
      
      if (response.success) {
        message.success('文字转语音命令已发送');
        form.resetFields();
        onTTSComplete?.();
      } else {
        message.error(response.message || 'TTS 失败');
      }
    } catch (error: any) {
      console.error('TTS 失败:', error);
      message.error(error.response?.data?.detail || error.message || 'TTS 失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 快速TTS按钮
  const quickTTS = [
    '你好，小米音响',
    '现在几点了？',
    '今天天气怎么样？',
    '播放一首音乐',
    '音量调大一点',
    '我回来了'
  ];

  const handleQuickTTS = async (text: string) => {
    await handleTTS({ text });
  };

  if (!selectedDevice) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <SoundOutlined style={{ fontSize: '24px', color: '#ccc' }} />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">请先选择设备以使用语音播报</Text>
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
          语音播报 (TTS)
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 文本输入 */}
        <Form
          form={form}
          onFinish={handleTTS}
          layout="vertical"
        >
          <Form.Item
            name="text"
            rules={[
              { required: true, message: '请输入要转换的文字' },
              { max: 500, message: '文字长度不能超过500字符' }
            ]}
          >
            <TextArea
              placeholder="输入要转换为语音的文字内容..."
              rows={3}
              maxLength={500}
              showCount
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              icon={<SendOutlined />}
              size="large"
            >
              发送语音播报
            </Button>
          </Form.Item>
        </Form>

        <Divider>快捷语音</Divider>

        {/* 快捷TTS按钮 */}
        <div>
          <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
            点击快速发送常用语音：
          </Text>
          <Space wrap size="small">
            {quickTTS.map((text, index) => (
              <Button
                key={index}
                size="small"
                onClick={() => handleQuickTTS(text)}
                disabled={isLoading}
              >
                {text}
              </Button>
            ))}
          </Space>
        </div>

        <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 提示：语音播报将通过选中的设备播放，请确保设备音量适中。
          </Text>
        </div>
      </Space>
    </Card>
  );
};
