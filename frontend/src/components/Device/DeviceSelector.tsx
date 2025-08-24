import { useEffect } from 'react';
import { Select, Card, Typography, Space, Button, Spin } from 'antd';
import { SoundOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDevices } from '@/hooks/useDevices';
import { useXiaomi } from '@/hooks/useXiaomi';
import type { DeviceInfo } from '@/types/api';

const { Text } = Typography;
const { Option } = Select;

interface DeviceSelectorProps {
  value?: DeviceInfo | null;
  onChange?: (device: DeviceInfo | null) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  value,
  onChange,
}) => {
  const { devices, selectedDevice, isLoading, fetchDevices, selectDevice } = useDevices();
  const { xiaomiStatus, checkXiaomiStatus } = useXiaomi();

  // 处理设备选择
  const handleDeviceChange = (deviceId: string) => {
    const device = devices.find(d => d.deviceID === deviceId);
    if (device) {
      selectDevice(device);
      onChange?.(device);
    }
  };

  // 刷新设备列表
  const handleRefresh = async () => {
    await Promise.all([
      fetchDevices(),
      checkXiaomiStatus()
    ]);
  };

  // 组件挂载时获取设备列表
  useEffect(() => {
    if (xiaomiStatus.logged_in) {
      fetchDevices();
    }
  }, [xiaomiStatus.logged_in, fetchDevices]);

  // 当设备列表变化时，确保onChange被调用
  useEffect(() => {
    if (selectedDevice && onChange) {
      onChange(selectedDevice);
    }
  }, [selectedDevice, onChange]);

  // 如果小米账号未登录，显示提示
  if (!xiaomiStatus.logged_in) {
    return (
      <Card size="small">
        <Space>
          <SoundOutlined />
          <Text type="secondary">请先登录小米账号以获取设备列表</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Card size="small" title="设备选择">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select<string>
            style={{ flex: 1 }}
            placeholder="选择要控制的设备"
            loading={isLoading}
            value={(value?.deviceID || selectedDevice?.deviceID) ?? undefined}
            onChange={handleDeviceChange}
            notFoundContent={isLoading ? <Spin size="small" /> : "暂无设备"}
            showSearch
            optionFilterProp="children"
            dropdownStyle={{ minWidth: '250px' }}
            allowClear
            optionLabelProp="label"
            optionRender={(option) => {
              const device = devices.find(d => d.deviceID === option.value);
              if (!device) return null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <SoundOutlined style={{ flex: '0 0 auto' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {device.alias || device.name || '未命名设备'}
                    </div>
                    {device.hardware && (
                      <div style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {device.hardware}
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          >
            {devices.map((device) => (
              <Option key={device.deviceID} value={device.deviceID} label={device.alias || device.name || '未命名设备'}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  width: '100%'
                }}>
                  <SoundOutlined />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      fontWeight: 'normal',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {device.alias || device.name || '未命名设备'}
                    </div>
                    {device.hardware && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {device.hardware}
                      </div>
                    )}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
            title="刷新设备列表"
          />
        </div>

        {(value || selectedDevice) && (
          <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <Text strong>当前设备：</Text>
            <Text>{(value || selectedDevice)?.alias || (value || selectedDevice)?.name}</Text>
            {(value || selectedDevice)?.hardware && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({(value || selectedDevice)?.hardware})
              </Text>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <Text type="secondary">已发现 {devices.length} 台设备</Text>
          {xiaomiStatus.devices_count && (
            <Text type="secondary">
              小米账号共有 {xiaomiStatus.devices_count} 台设备
            </Text>
          )}
        </div>
      </Space>
    </Card>
  );
};
