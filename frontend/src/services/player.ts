import { request } from '@/utils/http';
import type {
  PlayUrlRequest,
  PlayControlRequest,
  VolumeRequest,
  TTSRequest,
  PlaybackStatus,
  VolumeInfo,
  ApiResponse,
} from '@/types/api';

// 播放控制服务
export const playerService = {
  // 播放指定URL
  playUrl: async (data: PlayUrlRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/playback/play-url', data);
  },

  // 暂停播放
  pause: async (data: PlayControlRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/playback/pause', data);
  },

  // 恢复播放
  play: async (data: PlayControlRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/playback/play', data);
  },

  // 停止播放
  stop: async (data: PlayControlRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/playback/stop', data);
  },

  // 查询播放状态
  getPlaybackStatus: async (deviceSelector: string): Promise<ApiResponse<PlaybackStatus>> => {
    return request.get<ApiResponse<PlaybackStatus>>(`/mi/device/playback/status?device_selector=${encodeURIComponent(deviceSelector)}`);
  },

  // 文字转语音
  tts: async (data: TTSRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/tts', data);
  },

  // 设置音量
  setVolume: async (data: VolumeRequest): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/mi/device/volume', data);
  },

  // 获取音量
  getVolume: async (deviceSelector: string): Promise<ApiResponse<VolumeInfo>> => {
    return request.get<ApiResponse<VolumeInfo>>(`/mi/device/volume?device_selector=${encodeURIComponent(deviceSelector)}`);
  },
};
