from typing import Any, Dict, List, Optional, Tuple


def build_music_payload(url: str) -> Dict[str, Any]:
    return {
        "payload": {
            "audio_type": "MUSIC",
            "audio_items": [
                {
                    "item_id": {
                        "audio_id": 1582971365183456177,
                        "cp": {"album_id": "-1", "episode_index": 0, "id": 355454500, "name": "xiaowei"},
                    },
                    "stream": {"url": url},
                }
            ],
            "list_params": {"listId": "-1", "loadmore_offset": 0, "origin": "xiaowei", "type": "MUSIC"},
        },
        "play_behavior": "REPLACE_ALL",
    }


def sanitize_tts_text(text: str) -> str:
    # miio TTS 指令不允许空格，将空格替换为逗号
    return text.replace(" ", ",")


def parse_tts_cmd(tts_cmd: str) -> Tuple[int, int]:
    # 形如 "5-3" -> (5, 3)；仅数字则默认为 (cmd, 1)
    if "-" in tts_cmd:
        siid_str, aiid_str = tts_cmd.split("-", 1)
        return int(siid_str), int(aiid_str)
    return int(tts_cmd), 1


def find_device_info_by_id(devices: List[Dict[str, Any]], device_id: str) -> Optional[Dict[str, Any]]:
    return next((d for d in devices if d.get("deviceID") == device_id), None)


