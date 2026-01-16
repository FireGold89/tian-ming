# Bazi MCP 整合指南

本文檔說明如何更好地整合 Bazi MCP 到八字分析系統中。

## MCP 簡介

Model Context Protocol (MCP) 是一個標準化的協議，用於 AI 應用與外部數據源和工具的集成。

## Bazi MCP 安裝

### 方式 1：使用 npx（推薦，無需全局安裝）

```bash
npx @mymcp-fun/bazi
```

### 方式 2：全局安裝

```bash
npm install -g @mymcp-fun/bazi
bazi
```

## MCP 通訊方式

MCP 服務器通常通過以下方式通訊：

1. **stdio（標準輸入輸出）**：最常見的方式
2. **HTTP/WebSocket**：用於遠程調用
3. **進程間通訊**：通過管道或套接字

## 在 Python 中整合 MCP

### 方法 1：使用 MCP Python SDK（推薦）

```bash
pip install mcp
```

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def call_bazi_mcp():
    server_params = StdioServerParameters(
        command="npx",
        args=["@mymcp-fun/bazi"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(
                "calculate_bazi",
                arguments={
                    "year": 1990,
                    "month": 1,
                    "day": 1,
                    "hour": 12,
                    "minute": 0,
                    "timezone": "Asia/Taipei"
                }
            )
            return result
```

### 方法 2：直接使用 subprocess（當前實現）

如果 MCP 提供命令行接口，可以直接使用 subprocess：

```python
import subprocess
import json

def call_bazi_cli(year, month, day, hour, minute, timezone):
    result = subprocess.run(
        ['npx', '@mymcp-fun/bazi', 
         '--year', str(year),
         '--month', str(month),
         '--day', str(day),
         '--hour', str(hour),
         '--minute', str(minute),
         '--timezone', timezone],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)
```

### 方法 3：HTTP 接口（如果 MCP 提供）

某些 MCP 服務器提供 HTTP 接口：

```python
import requests

def call_bazi_http(year, month, day, hour, minute, timezone):
    response = requests.post('http://localhost:3000/mcp/bazi', json={
        'year': year,
        'month': month,
        'day': day,
        'hour': hour,
        'minute': minute,
        'timezone': timezone
    })
    return response.json()
```

## 改進建議

1. **安裝 MCP Python SDK**：
   ```bash
   pip install mcp
   ```

2. **使用異步調用**：MCP 通常支援異步操作，使用 asyncio 可以提高效能

3. **添加重試機制**：網路或進程間通訊可能失敗，添加重試邏輯

4. **緩存結果**：相同輸入的八字結果可以緩存

## 測試 MCP 連接

創建測試腳本 `test_mcp.py`：

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_bazi_mcp():
    server_params = StdioServerParameters(
        command="npx",
        args=["@mymcp-fun/bazi"]
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                print("✓ MCP 連接成功")
                
                # 測試調用
                result = await session.call_tool(
                    "calculate_bazi",
                    arguments={
                        "year": 1990,
                        "month": 1,
                        "day": 1,
                        "hour": 12,
                        "minute": 0,
                        "timezone": "Asia/Taipei"
                    }
                )
                print(f"結果: {result}")
                return True
    except Exception as e:
        print(f"✗ MCP 連接失敗: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_bazi_mcp())
```

## 資源

- [MCP 官方文檔](https://modelcontextprotocol.io/)
- [Bazi MCP npm 包](https://www.npmjs.com/package/@mymcp-fun/bazi)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)

