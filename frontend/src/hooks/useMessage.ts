// 自定义 Hook：获取 Ant Design message 实例
import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

export const useMessage = (): MessageInstance => {
  // 必须在 React 组件 / 其他 Hook 调用上下文中使用
  const { message } = App.useApp();
  return message;
};
