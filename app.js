// 八字分析系統前端 JavaScript (Client-Side Version)

// 五行映射表 (用於配色)
const WUXING_MAP = {
    // 天干
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water',
    // 地支 (主要五行)
    '寅': 'wood', '卯': 'wood',
    '巳': 'fire', '午': 'fire',
    '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
    '申': 'metal', '酉': 'metal',
    '亥': 'water', '子': 'water'
};

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('bazi-form');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');
    const errorMessage = document.getElementById('error-message');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            const navLinks = document.querySelector('.nav-links');
            const hamburger = document.querySelector('.hamburger');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', function () {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // --- Core Bazi Calculation Logic (Ported from Server) ---

    function getTerm(year) {
        // 簡易節氣計算 (僅作示例，實際應用需更精確算法或查表)
        // 這裡僅用簡單算法模擬立春 (2月4日左右)
        return 4;
    }

    function calculateBazi(dateObj) {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // 1-12
        const day = dateObj.getDate();
        const hour = dateObj.getHours();

        // 1. 年柱
        // 立春分界 (簡化：假設每年2月4日立春)
        let baziYear = year;
        if (month < 2 || (month === 2 && day < 4)) {
            baziYear = year - 1;
        }

        const yearStemIdx = (baziYear - 4) % 10;
        const yearBranchIdx = (baziYear - 4) % 12; // 1984 is Rat(0), 1984-4=1980%12=0? No.
        // 1900 is Rat. (1900-4)%12 = 8 (Shen/Monkey)? No.
        // 1924 is Rat (Jia Zi). 
        // Standard mapping: 4 AD is Jia Zi (0,0).
        // (year - 4) % 10 -> Stem. (2024 - 4) % 10 = 0 (Jia). Correct for 2024.
        // (year - 4) % 12 -> Branch. (2024 - 4) % 12 = 4 (Chen/Dragon). Correct for 2024.

        // 2. 月柱
        // 年上起月：甲己之年丙作首，乙庚之年戊為頭...
        // 乙年（yearStemIdx=1）的正月是戊寅月。
        const monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10; // 甲己為2(丙), 乙庚為4(戊)...

        // 月支：正月為寅(2)，二月為卯(3)... 十二月為丑(1)，下一個正月又是寅(2)
        // 這裡需要精確模擬月份與地支的對應。
        // 農曆月份與地支對應：1:寅(2), 2:卯(3), 3:辰(4), 4:巳(5), 5:午(6), 6:未(7), 7:申(8), 8:酉(9), 9:戌(10), 10:亥(11), 11:子(0), 12:丑(1)

        // 判斷當前處於哪個命理月
        let monthBranchIdx;
        if (month === 1) {
            // 1月通常是上一年的最後月（丑月）或更早，直到立春
            monthBranchIdx = 1; // 丑
        } else if (month === 2) {
            // 2月立春（通常4號）之前是丑月，之後是寅月
            monthBranchIdx = (day < 4) ? 1 : 2;
        } else {
            // 3月(3) -> 辰(4), 4月(4) -> 巳(5)...
            // 規律：monthBranchIdx = month
            monthBranchIdx = month;
        }

        // 計算月干索引
        // 偏移量：正月(寅)相對於月幹起點的偏移是 0，二月(卯)是 1...
        // 丑月(1) 相對於 寅月(2) 的偏移是 11（循環）
        let offset = (monthBranchIdx - 2 + 12) % 12;
        const monthStemIdx = (monthStemBase + offset) % 10;

        // 3. 日柱
        // 日柱需天文公式，這裡使用高斯公式模擬或簡易推算
        // 簡易模擬：基於 1900-01-31 (甲辰) 或類似基準
        const baseDate = new Date(1900, 0, 31);
        const daysDiff = Math.floor((dateObj - baseDate) / (1000 * 60 * 60 * 24));
        const dayStemIdx = (0 + daysDiff) % 10; // 0 was Jia
        const dayBranchIdx = (4 + daysDiff) % 12; // 4 was Chen

        // 4. 時柱
        // 日上起時：甲己還加甲...
        const hourStemBase = (dayStemIdx % 5) * 2;
        // Hour branch: 23-1 -> Zi(0), 1-3 -> Chou(1)...
        const hourBranchIdx = Math.floor((hour + 1) / 2) % 12;
        const hourStemIdx = (hourStemBase + hourBranchIdx) % 10;

        // Assemble
        const pillars = {
            year: { stem: TIANGAN[yearStemIdx], branch: DIZHI[yearBranchIdx] },
            month: { stem: TIANGAN[monthStemIdx % 10], branch: DIZHI[monthBranchIdx % 12] }, // Safe mod
            day: { stem: TIANGAN[dayStemIdx % 10], branch: DIZHI[dayBranchIdx % 12] },
            hour: { stem: TIANGAN[hourStemIdx], branch: DIZHI[hourBranchIdx] }
        };

        // Wuxing stats
        const wuxing = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 };
        const wuxingMap = {
            '甲': 'mu', '乙': 'mu', '丙': 'huo', '丁': 'huo', '戊': 'tu',
            '己': 'tu', '庚': 'jin', '辛': 'jin', '壬': 'shui', '癸': 'shui',
            '子': 'shui', '丑': 'tu', '寅': 'mu', '卯': 'mu', '辰': 'tu',
            '巳': 'huo', '午': 'huo', '未': 'tu', '申': 'jin', '酉': 'jin',
            '戌': 'tu', '亥': 'shui'
        };

        [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
            [p.stem, p.branch].forEach(char => {
                const type = wuxingMap[char];
                if (type) wuxing[type]++;
            });
        });

        // Zodiac
        const zodiacIdx = (baziYear - 4) % 12;
        const zodiac = ZODIAC[zodiacIdx];

        // Constellation
        const constellation = getConstellation(month, day);

        return {
            fourPillars: pillars,
            wuxing: wuxing,
            zodiac: zodiac,
            constellation: constellation,
            lunar: { year: `${baziYear}年`, date: `${month}月${day}日` } // Simplified
        };
    }

    function getConstellation(month, day) {
        const dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
        const constellations = ["摩羯座", "水瓶座", "雙魚座", "白羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座"];
        const startMonth = month - (day < dates[month - 1] ? 1 : 0);
        return constellations[startMonth];
    }

    function generateAnalysis(baziResult) {
        const wuxing = baziResult.wuxing;
        const maxVal = Math.max(...Object.values(wuxing));
        const strongest = Object.keys(wuxing).filter(k => wuxing[k] === maxVal);
        const labelMap = { 'jin': '金', 'mu': '木', 'shui': '水', 'huo': '火', 'tu': '土' };

        const strongestStr = strongest.map(k => labelMap[k]).join('、');
        const dayMaster = baziResult.fourPillars.day.stem;

        return `命造日主為「${dayMaster}」。\n五行能量分佈中，最強旺的是：「${strongestStr}」。\n\n(此為靜態簡易分析，AI 詳細解讀功能需連接後端服務)`;
    }

    // --- End Logic ---

    // Real-time Clock & Live Pillars
    function updateClockAndLive() {
        const now = new Date();

        // Clock
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();
        const secondDeg = ((seconds / 60) * 360);
        const minuteDeg = ((minutes / 60) * 360) + ((seconds / 60) * 6);
        const hourDeg = ((hours % 12 / 12) * 360) + ((minutes / 60) * 30);

        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');
        const secondHand = document.getElementById('second-hand');
        if (hourHand) {
            hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
            minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
            secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
        }

        // Date Text
        const gregorianEl = document.getElementById('current-gregorian-date');
        const lunarEl = document.getElementById('current-lunar-date');
        if (gregorianEl) {
            const y = now.getFullYear();
            const m = (now.getMonth() + 1).toString().padStart(2, '0');
            const d = now.getDate().toString().padStart(2, '0');
            const hh = now.getHours().toString().padStart(2, '0');
            const mm = now.getMinutes().toString().padStart(2, '0');
            gregorianEl.textContent = `公曆：${y}/${m}/${d} ${hh}:${mm}`;
        }
        if (lunarEl) {
            try {
                // 使用 Intl.DateTimeFormat 獲取農曆資訊
                const formatter = new Intl.DateTimeFormat('zh-TW', { calendar: 'chinese', dateStyle: 'long' });
                const parts = formatter.formatToParts(now);
                const yearName = parts.find(p => p.type === 'relatedYear')?.value || '';
                const monthName = parts.find(p => p.type === 'month')?.value || '';
                const dayName = parts.find(p => p.type === 'day')?.value || '';

                // 獲取干支年
                const bazi = calculateBazi(now);
                const ganZhiYear = bazi.fourPillars.year.stem + bazi.fourPillars.year.branch;

                lunarEl.textContent = `農曆：${ganZhiYear}年${monthName}${dayName}`;
            } catch (e) {
                lunarEl.textContent = '農曆：(計算中)';
            }
        }

        // Live Pillars (Client-side)
        const bazi = calculateBazi(now);
        const p = bazi.fourPillars;

        const updateEl = (id, char) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = char || '-';
                el.classList.remove('text-wood', 'text-fire', 'text-earth', 'text-metal', 'text-water');
                if (char && WUXING_MAP[char]) {
                    el.classList.add(`text-${WUXING_MAP[char]}`);
                }
            }
        };

        updateEl('live-year-stem', p.year.stem);
        updateEl('live-year-branch', p.year.branch);
        updateEl('live-month-stem', p.month.stem);
        updateEl('live-month-branch', p.month.branch);
        updateEl('live-day-stem', p.day.stem);
        updateEl('live-day-branch', p.day.branch);
        updateEl('live-hour-stem', p.hour.stem);
        updateEl('live-hour-branch', p.hour.branch);

        // Update Hourly List
        updateHourlyList(now, bazi.fourPillars.day.stem);
    }

    function updateHourlyList(now, dayStem) {
        const hourlyList = document.getElementById('hourly-list');
        if (!hourlyList) return;

        // Correct Day Stem Index (Jia=0, Yi=1...)
        const dayStemIdx = TIANGAN.indexOf(dayStem);
        if (dayStemIdx === -1) return;

        const hourNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        const hourTimes = ['23-01', '01-03', '03-05', '05-07', '07-09', '09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];

        // 日上起時算法
        const hourStemBase = (dayStemIdx % 5) * 2;
        const currentHour = now.getHours();

        // 判斷當前時辰地支索引 (23-1 為子(0))
        let currentBranchIdx = Math.floor((currentHour + 1) / 2) % 12;

        let html = '';
        for (let i = 0; i < 12; i++) {
            const stemIdx = (hourStemBase + i) % 10;
            const stem = TIANGAN[stemIdx];
            const branch = hourNames[i];
            const isActive = i === currentBranchIdx ? 'active' : '';

            html += `
                <div class="hourly-item ${isActive}" id="hour-item-${i}">
                    <div class="hourly-name">${branch}時</div>
                    <div class="hourly-pillars-mini">
                        <span class="text-${WUXING_MAP[stem]}">${stem}</span>
                        <span class="text-${WUXING_MAP[branch]}">${branch}</span>
                    </div>
                    <div class="hourly-time">${hourTimes[i]}</div>
                </div>
            `;
        }

        // Only update if innerHTML changed to avoid unnecessary DOM reflows
        if (hourlyList.innerHTML !== html) {
            hourlyList.innerHTML = html;
            // Scroll current hour into view if first time or changed
            const activeItem = hourlyList.querySelector('.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }

    // Init
    setInterval(updateClockAndLive, 1000);
    updateClockAndLive();


    // Form Handling
    const btnRealtime = document.getElementById('btn-realtime');
    if (btnRealtime) {
        btnRealtime.addEventListener('click', function () {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            document.getElementById('name').value = '即時局';
            document.getElementById('gender').value = 'male';
            document.getElementById('birth-date').value = `${year}-${month}-${day}`;
            document.getElementById('birth-time').value = `${hours}:${minutes}`;

            // Trigger analysis directly
            performAnalysis('即時局', 'male', now);
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value || '未命名';
        const gender = document.getElementById('gender').value;
        const dateStr = document.getElementById('birth-date').value;
        const timeStr = document.getElementById('birth-time').value;

        if (!dateStr || !timeStr) {
            alert('請輸入完整的出生日期和時間');
            return;
        }

        const birthDate = new Date(`${dateStr}T${timeStr}`);
        performAnalysis(name, gender, birthDate);
    });

    function performAnalysis(name, gender, dateObj) {
        // UI Loading
        errorMessage.style.display = 'none';
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        try {
            // Calculate
            const result = calculateBazi(dateObj);
            const analysisText = generateAnalysis(result);

            const displayData = {
                name: name,
                gender: gender,
                bazi: result,
                analysis: analysisText
            };

            // Delay for effect
            setTimeout(() => {
                displayResults(displayData);
                resultsSection.style.display = 'block';
                resultsSection.scrollIntoView({ behavior: 'smooth' });

                // Reset UI
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }, 600);

        } catch (e) {
            console.error(e);
            errorMessage.textContent = '計算發生錯誤';
            errorMessage.style.display = 'block';
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    function createBaziChar(char) {
        const type = WUXING_MAP[char];
        const wxClass = type ? `wx-${type}` : '';
        return `<div class="bazi-char ${wxClass}">${char || '?'}</div>`;
    }

    function createWuxingBar(label, value, colorClass) {
        const percentage = Math.min(100, Math.max(5, (value / 5) * 100)); // Rough scale
        return `
            <div class="wuxing-item">
                <span class="wuxing-label">${label}</span>
                <div class="wuxing-bar-container">
                    <div class="wuxing-bar-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <span style="min-width: 20px; text-align: right; font-size: 0.9rem;">${value}</span>
            </div>
        `;
    }

    function displayResults(data) {
        let html = '';
        const p = data.bazi.fourPillars;

        // 1. 八字
        html += `
            <div class="result-group">
                <div class="result-card full-width-card">
                    <h3><span class="icon">❖</span> 八字命盤</h3>
                    <div class="bazi-grid">
                        <div class="bazi-column">
                            <div class="bazi-column-header">年柱</div>
                            ${createBaziChar(p.year.stem)}
                            ${createBaziChar(p.year.branch)}
                        </div>
                        <div class="bazi-column">
                            <div class="bazi-column-header">月柱</div>
                            ${createBaziChar(p.month.stem)}
                            ${createBaziChar(p.month.branch)}
                        </div>
                        <div class="bazi-column">
                            <div class="bazi-column-header">日柱</div>
                            ${createBaziChar(p.day.stem)}
                            ${createBaziChar(p.day.branch)}
                        </div>
                        <div class="bazi-column">
                            <div class="bazi-column-header">時柱</div>
                            ${createBaziChar(p.hour.stem)}
                            ${createBaziChar(p.hour.branch)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 2. Info
        html += '<div class="result-group">';
        html += `
            <div class="result-card">
                <h3><span class="icon">👤</span> 個人資訊</h3>
                <div class="result-item">
                    <span class="result-label">姓名</span>
                    <span class="result-value">${data.name}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">性別</span>
                    <span class="result-value">${data.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">生肖</span>
                    <span class="result-value">${data.bazi.zodiac}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">星座</span>
                    <span class="result-value">${data.bazi.constellation}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">農曆</span>
                    <span class="result-value">${data.bazi.lunar.year} ${data.bazi.lunar.date}</span>
                </div>
            </div>
        `;

        // Wuxing
        const wx = data.bazi.wuxing;
        html += `
            <div class="result-card">
                <h3><span class="icon">⚖️</span> 五行能量</h3>
                <div class="wuxing-bar">
                    ${createWuxingBar('金', wx.jin, 'wx-metal')}
                    ${createWuxingBar('木', wx.mu, 'wx-wood')}
                    ${createWuxingBar('水', wx.shui, 'wx-water')}
                    ${createWuxingBar('火', wx.huo, 'wx-fire')}
                    ${createWuxingBar('土', wx.tu, 'wx-earth')}
                </div>
            </div>
        `;
        html += '</div>';

        // 3. Analysis
        html += `
            <div class="result-card full-width-card">
                <h3><span class="icon">📜</span> 簡易解讀</h3>
                <div style="line-height: 1.8; color: var(--text-main); font-size: 1.05rem;">
                    ${data.analysis.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
    }

});



