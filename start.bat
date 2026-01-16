@echo off
chcp 65001 >nul
echo ========================================
echo   八字命理分析系統 - 啟動腳本
echo ========================================
echo.

REM 檢查 Python 是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 未找到 Python，請先安裝 Python 3.7 或更高版本
    pause
    exit /b 1
)

echo [1/3] 檢查 Python 依賴...
pip install -r requirements.txt --quiet

echo [2/3] 檢查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [警告] 未找到 Node.js，Bazi MCP 功能可能無法使用
) else (
    echo [✓] Node.js 已安裝
)

echo [3/3] 啟動服務器...
echo.
echo ========================================
echo   服務器啟動中...
echo   請在瀏覽器中訪問: http://localhost:5000
echo   按 Ctrl+C 停止服務器
echo ========================================
echo.

python server.py

pause

