import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 檢查並動態安裝 puppeteer
async function ensurePuppeteer() {
  try {
    const { default: puppeteer } = await import('puppeteer');
    return puppeteer;
  } catch (e) {
    console.log('正在為您安裝 puppeteer，這可能需要一至二分鐘，請稍候...');
    execSync('yarn add -D puppeteer', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    const { default: puppeteer } = await import('puppeteer');
    return puppeteer;
  }
}

async function main() {
  const puppeteer = await ensurePuppeteer();
  
  console.log('啟動 Headless 瀏覽器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors', // 忽略本地自簽憑證錯誤
      '--allow-insecure-localhost'    // 允許 localhost 不安全憑證
    ],
    defaultViewport: { width: 1440, height: 960 }
  });
  
  const page = await browser.newPage();
  const baseUrl = 'https://localhost:7000';
  
  // 監聽 console 與錯誤
  page.on('console', msg => console.log('瀏覽器主控台:', msg.text()));
  page.on('pageerror', err => console.log('瀏覽器錯誤:', err.message));
  
  // 攔截並 Mock dev.json 請求以防止 Nuxt client hydration 崩潰
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/_nuxt/builds/meta/dev.json')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'dev',
          timestamp: Date.now(),
          matchers: []
        })
      });
    } else {
      request.continue();
    }
  });
  
  // 建立圖片暫存區
  const tempDir = path.join(__dirname, '../docs/images-temp-front');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`前往登入頁面: ${baseUrl}/login`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    // 如果找不到 input，嘗試重新整理 (Nuxt dev server 冷啟動問題)
    let hasInputs = await page.evaluate(() => document.querySelectorAll('input').length > 0);
    if (!hasInputs) {
      console.log('偵測到頁面可能加載未完成（無輸入框），嘗試重新載入 (Reload)...');
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 4000));
    }

    console.log('填寫一般會友 (戴觀望) 登入表單...');
    await page.waitForSelector('input', { timeout: 10000 });
    
    // 尋找帳號欄位並輸入 (戴觀望帳號)
    const inputsInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(i => ({ type: i.type, placeholder: i.placeholder }));
    });
    
    let accountSelector = 'input[type="text"]';
    if (inputsInfo.some(i => i.placeholder && i.placeholder.includes('Email'))) {
      accountSelector = 'input[placeholder*="Email"]';
    }
    
    await page.type(accountSelector, 'dai.gw@example.com');
    await page.type('input[type="password"]', 'Test@12345');
    
    console.log('點擊登入按鈕...');
    await page.click('button[type="submit"]');
    
    console.log('等待頁面跳轉至前台首頁...');
    // 一般會友登入後會被導航至首頁 '/'
    await page.waitForFunction(() => window.location.pathname === '/' || window.location.pathname === '/explore', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000)); // 多等幾秒載入 mock 資料與動畫

    const capturedPages = [];

    // 1. 前台首頁
    console.log('前往前台首頁...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    let imgPath = path.join(tempDir, 'front-home.png');
    await page.screenshot({ path: imgPath });
    capturedPages.push({
      name: 'front-home',
      title: '前台首頁 / 會員專區入口',
      base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    });

    // 2. 探索課程列表
    console.log('前往探索課程列表...');
    await page.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    imgPath = path.join(tempDir, 'front-explore.png');
    await page.screenshot({ path: imgPath });
    capturedPages.push({
      name: 'front-explore',
      title: '課程裝備探索 (Explore Courses)',
      base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    });

    // 3. 課程詳情頁 (試圖點擊第一個課程)
    console.log('尋找並進入課程詳情頁...');
    try {
      // 尋找 a 標籤含有 /explore/ 的路徑
      const hasLink = await page.evaluate(() => {
        const link = document.querySelector('a[href*="/explore/"]');
        return !!link;
      });

      if (hasLink) {
        await page.click('a[href*="/explore/"]');
        await new Promise(r => setTimeout(r, 4000));
        imgPath = path.join(tempDir, 'front-course-detail.png');
        await page.screenshot({ path: imgPath });
        capturedPages.push({
          name: 'front-course-detail',
          title: '課程與班級詳情介紹 (Course Details)',
          base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
        });
        // 返回 /explore 列表頁
        await page.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log('未找到課程連結，手動進入預設詳情頁...');
        await page.goto(`${baseUrl}/explore/tpl-s101`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 4000));
        imgPath = path.join(tempDir, 'front-course-detail.png');
        await page.screenshot({ path: imgPath });
        capturedPages.push({
          name: 'front-course-detail',
          title: '課程與班級詳情介紹 (Course Details)',
          base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
        });
      }
    } catch (e) {
      console.error('進入課程詳情失敗:', e.message);
    }

    // 4. 我的學習列表
    console.log('前往我的學習列表...');
    await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    imgPath = path.join(tempDir, 'front-learn.png');
    await page.screenshot({ path: imgPath });
    capturedPages.push({
      name: 'front-learn',
      title: '我的裝備學習 (My Learning)',
      base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    });

    // 5. 班級學習頁面 (試圖點擊第一個已報名的學習班級)
    console.log('尋找並進入班級學習進度頁...');
    try {
      const hasLearnLink = await page.evaluate(() => {
        const link = document.querySelector('a[href*="/learn/"]');
        return !!link;
      });

      if (hasLearnLink) {
        await page.click('a[href*="/learn/"]');
        await new Promise(r => setTimeout(r, 4000));
        imgPath = path.join(tempDir, 'front-class-detail.png');
        await page.screenshot({ path: imgPath });
        capturedPages.push({
          name: 'front-class-detail',
          title: '班級學習進度與課堂資訊 (Class Learning Details)',
          base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
        });
      } else {
        console.log('未找到學習班級連結，跳過此頁面');
      }
    } catch (e) {
      console.error('進入班級學習頁面失敗:', e.message);
    }

    // 6. 個人檔案頁面
    console.log('前往個人檔案頁面...');
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    imgPath = path.join(tempDir, 'front-profile.png');
    await page.screenshot({ path: imgPath });
    capturedPages.push({
      name: 'front-profile',
      title: '個人基本資料與信仰歷程 (My Profile)',
      base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    });

    // 7. 個人帳號設定
    console.log('前往個人帳號設定...');
    await page.goto(`${baseUrl}/profile/settings`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    imgPath = path.join(tempDir, 'front-profile-settings.png');
    await page.screenshot({ path: imgPath });
    capturedPages.push({
      name: 'front-profile-settings',
      title: '帳號與聯絡資訊變更 (Account Settings)',
      base64: `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`
    });

    console.log('生成 HTML 前台導覽報告中...');
    const htmlContent = generateHtmlReport(capturedPages);
    const htmlPath = path.join(tempDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent);

    console.log('將 HTML 導覽轉換為 PDF 檔案...');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const pdfPath = path.join(__dirname, '../docs/開發相關文件/NHECC-CHMS_前台功能導覽.pdf');
    const pdfDir = path.dirname(pdfPath);
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #94a3b8; font-family: Inter, sans-serif;">NHECC-CHMS 前台功能使用者手冊</div>',
      footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #94a3b8; font-family: Inter, sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    console.log(`\n🎉 PDF 前台報告已成功生成至: ${pdfPath}\n`);

  } catch (error) {
    console.error('執行過程出錯:', error);
    try {
      const errorHtml = await page.content();
      fs.writeFileSync(path.join(__dirname, '../docs/error-debug-front.html'), errorHtml);
      await page.screenshot({ path: path.join(__dirname, '../docs/error-screenshot-front.png') });
      console.log('已儲存出錯時的 HTML 於 docs/error-debug-front.html，以及截圖於 docs/error-screenshot-front.png');
    } catch (e) {
      console.error('無法儲存錯誤現場資料:', e);
    }
  } finally {
    await browser.close();
    
    // 清理暫存圖片與 HTML 檔
    try {
      console.log('清理暫存檔案...');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('清理暫存檔失敗:', e);
    }
  }
}

function generateHtmlReport(pages) {
  const sectionsHtml = pages.map((p) => {
    let featureDesc = '';
    switch (p.name) {
      case 'front-home':
        featureDesc = `
          <ul>
            <li><strong>個人狀態概覽看板：</strong>會友登入後的專屬首頁，能一眼瀏覽當前已報名與進行中的課程狀態。</li>
            <li><strong>便民捷徑功能：</strong>提供「探索課程」與「學習進度」的快速連結入口。</li>
            <li><strong>最新通知提示：</strong>包含即將上課時間提醒、未點名補簽到與開班公告。</li>
          </ul>
        `;
        break;
      case 'front-explore':
        featureDesc = `
          <ul>
            <li><strong>全域課程目錄：</strong>以卡片式與條列式呈現教會目前開設的所有培訓裝備課程。</li>
            <li><strong>分類篩選與探索：</strong>可依據不同信仰裝備階段（如慕道、初信、門徒、領袖培育）進行精準篩選。</li>
            <li><strong>課程概要展示：</strong>卡片直觀列出課程代碼、名稱、簡介、目前報名人數比率，引導學員報名。</li>
          </ul>
        `;
        break;
      case 'front-course-detail':
        featureDesc = `
          <ul>
            <li><strong>詳細資訊說明：</strong>展示課程的起迄日期、授課時數、上課頻率、實體上課地點以及授課老師。</li>
            <li><strong>先修條件嚴格審查：</strong>系統自動依據登入會友的受洗狀態與歷史修課紀錄，動態比對是否符合該課程的先修條件，以確保學習成效。</li>
            <li><strong>即時報名系統：</strong>若符合資格且班級尚未額滿，學員可一鍵送出報名。已滿額或已報名將會有限制提示。</li>
          </ul>
        `;
        break;
      case 'front-learn':
        featureDesc = `
          <ul>
            <li><strong>個人學習歷程整合：</strong>統一管理所有「進行中」、「即將開始」與「過去已完成」的裝備班級。</li>
            <li><strong>我的課表進度：</strong>顯示目前正在修讀的課程名稱、授課老師與當前開班狀態，便於追蹤學習進程。</li>
          </ul>
        `;
        break;
      case 'front-class-detail':
        featureDesc = `
          <ul>
            <li><strong>班級主頁面：</strong>點選課程進入，展示該實體班級詳細的課表大綱、上課日期與地點。</li>
            <li><strong>學習進度追蹤：</strong>呈現當前已進行的堂數，以及學員個人的出席點名紀錄。</li>
            <li><strong>學習教材連結：</strong>可查閱或下載課堂講義與授課老師上傳的附件教材。</li>
          </ul>
        `;
        break;
      case 'front-profile':
        featureDesc = `
          <ul>
            <li><strong>電子會友資料卡：</strong>以優雅的介面設計顯示個人的全名、性別、出生日期與聯絡電話。</li>
            <li><strong>牧養歸屬資訊：</strong>展示個人所屬的「牧區 (Zone)」與「小組 (Group)」，方便了解會友關係。</li>
            <li><strong>信仰歷程紀錄：</strong>清楚呈現受洗狀態（如是否已洗禮、受洗日期）以及在教會完成的核心培育課程。</li>
          </ul>
        `;
        break;
      case 'front-profile-settings':
        featureDesc = `
          <ul>
            <li><strong>基本資料自維護：</strong>會友可自行更新電話、通訊地址、LINE ID 以及緊急聯絡人資訊。</li>
            <li><strong>密碼與安全變更：</strong>提供獨立的修改密碼入口，保護帳號安全。</li>
            <li><strong>資料同步防護：</strong>與後端 Firebase Auth 完美同步，更新資料同時寫入會友資料庫。</li>
          </ul>
        `;
        break;
    }

    return `
      <div class="section-card page-break">
        <h2>${p.title}</h2>
        <div class="description-box">
          <h3>使用者前台功能</h3>
          ${featureDesc}
        </div>
        <div class="screenshot-container">
          <img src="${p.base64}" alt="${p.title}" />
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <title>NHECC-CHMS 前台功能使用者手冊</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
        
        body {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          line-height: 1.6;
        }
        
        h1, h2, h3 {
          color: #0f172a;
          margin-top: 0;
        }

        .cover-page {
          height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          margin-bottom: 50px;
          background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%);
        }

        .cover-logo {
          width: 120px;
          height: 120px;
          margin-bottom: 30px;
        }

        .cover-title {
          font-size: 38px;
          font-weight: 700;
          color: #166534;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .cover-subtitle {
          font-size: 20px;
          color: #374151;
          margin-bottom: 50px;
        }

        .cover-meta {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 100px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          width: 60%;
        }

        .page-break {
          page-break-before: always;
        }

        .section-card {
          margin-bottom: 40px;
          padding-bottom: 20px;
        }

        h2 {
          font-size: 24px;
          border-left: 5px solid #16a34a;
          padding-left: 12px;
          margin-bottom: 20px;
          color: #166534;
        }

        .description-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }

        .description-box h3 {
          font-size: 16px;
          color: #334155;
          margin-bottom: 10px;
        }

        .description-box ul {
          margin: 0;
          padding-left: 20px;
        }

        .description-box li {
          margin-bottom: 8px;
          font-size: 14px;
          color: #475569;
        }

        .screenshot-container {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          background-color: #f1f5f9;
        }

        .screenshot-container img {
          width: 100%;
          display: block;
        }
      </style>
    </head>
    <body>
      <!-- 封面 -->
      <div class="cover-page">
        <svg class="cover-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22H22L12 2Z" fill="#16a34a" stroke="#15803d" stroke-width="2" stroke-linejoin="round"/>
          <path d="M12 7V17M7 12H17" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="cover-title">NHECC-CHMS</div>
        <div class="cover-subtitle">前台使用者功能導覽手冊</div>
        <div class="cover-meta">
          <p>產出對象：一般教友 / 註冊會員 (General Member)</p>
          <p>系統環境：Firebase Local Emulator & Nuxt 4 Dev Server</p>
          <p>產生日期：${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}</p>
        </div>
      </div>

      <!-- 各頁面功能導覽 -->
      ${sectionsHtml}
    </body>
    </html>
  `;
}

main().catch(console.error);
