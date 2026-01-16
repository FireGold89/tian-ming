#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
八字分析系統後端服務器
整合 Bazi MCP 提供精準的八字分析
"""

import os
import json
import subprocess
import sys
import asyncio
from datetime import datetime
from calendar import monthrange
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging

# MCP Imports
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    MCP_SDK_AVAILABLE = True
except ImportError:
    MCP_SDK_AVAILABLE = False

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaziMCPClient:
    """Bazi MCP 客戶端"""
    
    def __init__(self):
        self.mcp_available = False
        
    def check_mcp_available(self):
        """檢查 Bazi MCP 是否可用"""
        try:
            # 檢查 Node.js 是否安裝
            result = subprocess.run(
                ['node', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                logger.warning("未找到 Node.js")
                self.mcp_available = False
                return False
            
            # 檢查是否安裝了 MCP SDK
            if not MCP_SDK_AVAILABLE:
                logger.warning("未安裝 MCP Python SDK")
                self.mcp_available = False
                return False

            self.mcp_available = True
            logger.info("Bazi MCP 環境檢查通過")
            return True
        except Exception as e:
            logger.warning(f"Bazi MCP 檢查失敗: {e}")
            self.mcp_available = False
            return False
    
    async def call_mcp_async(self, birth_datetime, timezone, gender=None):
        """異步調用 MCP"""
        if not self.mcp_available:
            return None

        logger.info("正在連接 MCP 服務器...")
        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@mymcp-fun/bazi"],
            env=os.environ.copy()
        )
        
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    
                    # 查找工具
                    tools_result = await session.list_tools()
                    tool_name = None
                    for tool in tools_result.tools:
                        if "bazi" in tool.name.lower() or "calculate" in tool.name.lower():
                            tool_name = tool.name
                            break
                    
                    if not tool_name:
                        # 嘗試使用默認名稱
                        tool_name = "calculate_bazi"
                        logger.warning(f"未找到匹配的工具，嘗試使用默認名稱: {tool_name}")
                    else:
                        logger.info(f"使用 MCP 工具: {tool_name}")

                    arguments = {
                        "year": birth_datetime.year,
                        "month": birth_datetime.month,
                        "day": birth_datetime.day,
                        "hour": birth_datetime.hour,
                        "minute": birth_datetime.minute,
                        "timezone": timezone,
                        "gender": gender if gender else "unknown"
                    }
                    
                    result = await session.call_tool(tool_name, arguments=arguments)
                    
                    # 解析結果
                    if hasattr(result, 'content') and result.content:
                        for content in result.content:
                            if content.type == 'text':
                                try:
                                    raw_data = json.loads(content.text)
                                    return self._transform_mcp_result(raw_data)
                                except json.JSONDecodeError:
                                    logger.warning(f"MCP 返回非 JSON 文本: {content.text[:100]}")
                                    pass
                    
                    logger.warning("MCP 未返回有效內容")
                    return None

        except Exception as e:
            logger.error(f"調用 MCP 失敗: {e}", exc_info=True)
            return None

    def _transform_mcp_result(self, raw_data):
        """將 MCP 的中文返回格式轉換為前端需要的格式"""
        if not raw_data:
            return raw_data
            
        # 確定 bazi 數據源
        if 'bazi' in raw_data and isinstance(raw_data['bazi'], dict):
            bazi = raw_data['bazi']
        else:
            bazi = raw_data # 假設 raw_data 本身就是數據
            
        formatted = {}
        
        # 處理四柱
        if '四柱' in bazi:
            pillars = bazi['四柱']
            formatted['fourPillars'] = {}
            # 嘗試兩種繁簡寫
            mcp_mapping = {
                '年柱': 'year', '月柱': 'month', '日柱': 'day', '時柱': 'hour', '时柱': 'hour'
            }
            
            for cn_key, en_key in mcp_mapping.items():
                if cn_key in pillars:
                    val = pillars[cn_key]
                    if val and len(val) >= 2:
                        formatted['fourPillars'][en_key] = {
                            'stem': val[0],
                            'branch': val[1]
                        }
        elif 'fourPillars' in bazi:
             formatted['fourPillars'] = bazi['fourPillars']

        # 處理五行
        if '五行' in bazi:
            wx = bazi['五行']
            wx_map = {'金': 'jin', '木': 'mu', '水': 'shui', '火': 'huo', '土': 'tu'}
            formatted['wuxing'] = {}
            for k, v in wx.items():
                if k in wx_map:
                    formatted['wuxing'][wx_map[k]] = v
        elif 'wuxing' in bazi:
            formatted['wuxing'] = bazi['wuxing']
        
        # 處理其他
        if '生肖' in bazi:
            formatted['zodiac'] = bazi['生肖']
        elif 'zodiac' in bazi:
            formatted['zodiac'] = bazi['zodiac']

        if '星座' in bazi:
            formatted['constellation'] = bazi['星座']
        elif 'constellation' in bazi:
             formatted['constellation'] = bazi['constellation']

        if '农历' in bazi or '農曆' in bazi:
            lunar = bazi.get('农历') or bazi.get('農曆')
            formatted['lunar'] = {
                'year': f"{lunar.get('农历年') or lunar.get('農曆年', '')}年",
                'date': f"{lunar.get('农历月') or lunar.get('農曆月', '')}月{lunar.get('农历日') or lunar.get('農曆日', '')}日"
            }
        elif 'lunar' in bazi:
            formatted['lunar'] = bazi['lunar']
            
        return formatted

    def calculate_bazi_sync_wrapper(self, birth_datetime, timezone, gender=None):
        """同步包裝器 (備用)"""
        # 如果 Flask 是純同步模式，使用 asyncio.run
        # 但在 route 中使用 async def 更佳
        return asyncio.run(self.call_mcp_async(birth_datetime, timezone, gender))
    
    def calculate_bazi_fallback(self, birth_datetime, timezone, gender):
        """備用八字計算方法"""
        logger.info("使用備用八字計算方法")
        
        tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
        dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
        
        year = birth_datetime.year
        month = birth_datetime.month
        day = birth_datetime.day
        hour = birth_datetime.hour
        
        year_stem_idx = (year - 4) % 10
        year_branch_idx = (year - 4) % 12
        
        # 簡單計算月柱 (不準確，僅作示例)
        month_stem_idx = (year_stem_idx * 2 + month - 1) % 10
        month_branch_idx = (month + 1) % 12
        
        # 簡單計算日柱
        base_year = 1900
        year_offset = year - base_year
        base_number = (year_offset * 365 + year_offset // 4) % 60
        total_days = sum(monthrange(year, m)[1] for m in range(1, month)) + day - 1
        day_stem_idx = (base_number + total_days) % 10
        day_branch_idx = (base_number + total_days) % 12
        
        hour_stem_idx = (day_stem_idx * 2 + (hour + 1) // 2) % 10
        hour_branch_idx = (hour + 1) // 2 % 12
        
        zodiac_animals = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬']
        zodiac_idx = (year - 4) % 12
        
        wuxing_map = {
            '甲': 'mu', '乙': 'mu', '丙': 'huo', '丁': 'huo', '戊': 'tu',
            '己': 'tu', '庚': 'jin', '辛': 'jin', '壬': 'shui', '癸': 'shui',
            '子': 'shui', '丑': 'tu', '寅': 'mu', '卯': 'mu', '辰': 'tu',
            '巳': 'huo', '午': 'huo', '未': 'tu', '申': 'jin', '酉': 'jin',
            '戌': 'tu', '亥': 'shui'
        }
        
        stems = [tiangan[year_stem_idx], tiangan[month_stem_idx], tiangan[day_stem_idx], tiangan[hour_stem_idx]]
        branches = [dizhi[year_branch_idx], dizhi[month_branch_idx], dizhi[day_branch_idx], dizhi[hour_branch_idx]]
        
        wuxing = {'jin': 0, 'mu': 0, 'shui': 0, 'huo': 0, 'tu': 0}
        for char in stems + branches:
            if char in wuxing_map:
                wuxing[wuxing_map[char]] += 1
        
        return {
            'fourPillars': {
                'year': {'stem': tiangan[year_stem_idx], 'branch': dizhi[year_branch_idx]},
                'month': {'stem': tiangan[month_stem_idx], 'branch': dizhi[month_branch_idx]},
                'day': {'stem': tiangan[day_stem_idx], 'branch': dizhi[day_branch_idx]},
                'hour': {'stem': tiangan[hour_stem_idx], 'branch': dizhi[hour_branch_idx]}
            },
            'zodiac': zodiac_animals[zodiac_idx],
            'lunar': {'year': f"{year}年", 'date': f"{month}月{day}日"},
            'wuxing': wuxing,
            'constellation': self._get_constellation(month, day)
        }
    
    def _get_constellation(self, month, day):
        constellations = [
            (1, 20, "摩羯座"), (2, 19, "水瓶座"), (3, 21, "雙魚座"),
            (4, 20, "白羊座"), (5, 21, "金牛座"), (6, 21, "雙子座"),
            (7, 23, "巨蟹座"), (8, 23, "獅子座"), (9, 23, "處女座"),
            (10, 23, "天秤座"), (11, 22, "天蠍座"), (12, 22, "射手座")
        ]
        for m, d, name in constellations:
            if month == m and day <= d: return name
        # Handle wrap around for Capricorn
        if month == 12 and day >= 22: return "摩羯座"
        # Search next
        for m, d, name in constellations:
             if month == m - 1 and day > (20 if m==2 else 30): # Simplified check
                  pass
        # Better fallback:
        # Check next month match
        next_idx = -1
        for i, (m, d, name) in enumerate(constellations):
            if month == m:
                # If day > d, it's the next sign
                if day > d: 
                    return constellations[(i + 1) % 12][2]
                return name
        return "摩羯座"

# 初始化 MCP 客戶端
mcp_client = BaziMCPClient()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/bazi', methods=['POST'])
async def calculate_bazi_endpoint():
    """計算八字 API"""
    try:
        data = request.json
        if not data.get('birthDate') or not data.get('birthTime'):
            return jsonify({'error': '請提供出生日期和時間'}), 400
        
        birth_str = f"{data['birthDate']} {data['birthTime']}"
        birth_datetime = datetime.strptime(birth_str, "%Y-%m-%d %H:%M")
        
        # 嘗試使用 MCP
        if not mcp_client.mcp_available:
            mcp_client.check_mcp_available()
            
        bazi_result = await mcp_client.call_mcp_async(
            birth_datetime, 
            data.get('timezone', 'Asia/Taipei'),
            data.get('gender')
        )
        
        # 如果 MCP 失敗，使用備用
        if not bazi_result:
            bazi_result = mcp_client.calculate_bazi_fallback(
                birth_datetime, 
                data.get('timezone', 'Asia/Taipei'),
                data.get('gender')
            )
        
        response = {
            'name': data.get('name', ''),
            'gender': data.get('gender', ''),
            'bazi': bazi_result,
            'analysis': generate_analysis(bazi_result)
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"計算八字錯誤: {e}", exc_info=True)
        return jsonify({'error': f'計算失敗: {str(e)}'}), 500

def generate_analysis(bazi_result):
    if not bazi_result: return "分析失敗"
    wuxing = bazi_result.get('wuxing', {})
    if not wuxing: return "數據不足"
    
    max_val = max(wuxing.values()) if wuxing else 0
    strongest = [k for k, v in wuxing.items() if v == max_val]
    
    label_map = {'jin': '金', 'mu': '木', 'shui': '水', 'huo': '火', 'tu': '土'}
    strongest_str = "、".join([label_map.get(k, k) for k in strongest])
    
    return f"五行最強旺的是：{strongest_str}。您的日主是 {bazi_result.get('fourPillars', {}).get('day', {}).get('stem', '未知')}。"

if __name__ == '__main__':
    # 檢查 MCP 可用性
    mcp_client.check_mcp_available()
    
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"服務器啟動在 http://localhost:{port}")
    # Flask 2.0+ supports await properly if using 'flask run' or app.run() with async extras
    # But usually app.run() is threaded.
    app.run(host='127.0.0.1', port=port, debug=True)

