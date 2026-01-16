# 八字命理分析系統

這是一個基於 Bazi MCP (Model Context Protocol) 技術的八字分析網站，提供精準的八字命理分析服務。

## 功能特色

- 🎋 **完整的八字四柱計算**：準確計算年、月、日、時四柱
- 🌙 **農曆日期轉換**：自動轉換公曆到農曆
- 🐉 **生肖與星座**：顯示生肖和星座資訊
- ⚡ **五行分析**：詳細的五行分布分析
- 🌍 **全球時區支援**：支援多個時區的準確計算
- 🎨 **現代化界面**：美觀易用的網頁界面

## 技術架構

- **前端**：HTML5, CSS3, JavaScript (Vanilla JS)
- **後端**：Python Flask
- **MCP 整合**：Bazi MCP (`@mymcp-fun/bazi`)

## 安裝步驟

### 1. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

### 2. 安裝 Node.js 和 npm

確保您的系統已安裝 Node.js 和 npm。如果尚未安裝，請前往 [Node.js 官網](https://nodejs.org/) 下載安裝。

### 3. 驗證 Bazi MCP

系統會自動檢查 Bazi MCP 是否可用。如果需要手動安裝：

```bash
npm install -g @mymcp-fun/bazi
```

或者直接使用（無需全局安裝）：

```bash
npx @mymcp-fun/bazi
```

### 4. 啟動服務器

```bash
python server.py
```

服務器將在 `http://localhost:5000` 啟動。

## 使用方法

1. 打開瀏覽器，訪問 `http://localhost:5000`
2. 填寫個人資料：
   - 姓名（選填）
   - 性別
   - 出生日期
   - 出生時間
   - 時區
3. 點擊「開始分析」按鈕
4. 查看分析結果

## 項目結構

```
Bazi/
├── index.html          # 前端頁面
├── style.css          # 樣式表
├── app.js             # 前端 JavaScript
├── server.py          # 後端服務器
├── requirements.txt   # Python 依賴
└── README.md          # 說明文件
```

## Bazi MCP 整合

本系統優先使用 Bazi MCP 進行八字計算，提供更準確的分析結果。如果 MCP 服務不可用，系統會自動切換到備用計算方法。

### MCP 優勢

- ✅ 更準確的計算算法
- ✅ 完整的農曆支援
- ✅ 全球時區支援
- ✅ 標準化的 MCP 協議

## 開發說明

### 自定義分析

您可以編輯 `server.py` 中的 `generate_analysis()` 函數來自定義分析內容。

### 樣式自定義

修改 `style.css` 中的 CSS 變量來調整網站外觀：

```css
:root {
    --primary-color: #8B4513;
    --secondary-color: #D4AF37;
    --bg-color: #F5F5DC;
    /* ... */
}
```

## 故障排除

### Bazi MCP 無法連接

1. 確認 Node.js 已正確安裝：`node --version`
2. 嘗試手動運行：`npx @mymcp-fun/bazi`
3. 檢查網路連接（首次使用 npx 需要下載包）
4. 系統會自動使用備用計算方法
5. 詳見 `MCP_INTEGRATION.md` 獲取更多整合資訊

### 改進 MCP 整合（可選）

如果您想要更好的 MCP 整合，可以：

1. 安裝 MCP Python SDK：
   ```bash
   pip install mcp
   ```

2. 修改 `server.py` 使用 MCP SDK（詳見 `MCP_INTEGRATION.md`）

3. 這樣可以獲得更準確的八字計算結果

### 端口被占用

修改 `server.py` 最後一行的端口號：

```python
app.run(host='0.0.0.0', port=8080, debug=True)
```

## 授權

本項目僅供學習和研究使用。

## 參考資料

- [Bazi MCP 官方文檔](https://www.npmjs.com/package/@mymcp-fun/bazi)
- [Flask 官方文檔](https://flask.palletsprojects.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

