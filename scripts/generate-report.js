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
      console.log('攔截並 Mock dev.json 請求...');
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
  const tempDir = path.join(__dirname, '../docs/images-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`前往登入頁面: ${baseUrl}/login`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000)); // 多等一下確保 SSR 結束與 hydration 正常

    // 如果找不到 input，嘗試重新整理（Nuxt dev server 冷啟動常會因 manifest 404 報錯）
    let hasInputs = await page.evaluate(() => document.querySelectorAll('input').length > 0);
    if (!hasInputs) {
      console.log('偵測到頁面可能加載未完成（無輸入框），嘗試重新載入 (Reload)...');
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 4000));
    }

    // 再次檢查 inputs
    const inputsInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        outerHTML: i.outerHTML
      }));
    });
    console.log('當前頁面 inputs 資訊:', JSON.stringify(inputsInfo, null, 2));

    console.log('填寫登入表單...');
    await page.waitForSelector('input', { timeout: 10000 });
    
    // 優先選 placeholder 包含 Email 的，不然選第一個 text input
    let accountSelector = 'input[type="text"]';
    if (inputsInfo.some(i => i.placeholder && i.placeholder.includes('Email'))) {
      accountSelector = 'input[placeholder*="Email"]';
    }
    
    await page.type(accountSelector, 'admin@nhecc.org');
    await page.type('input[type="password"]', 'Test@12345');
    
    console.log('點擊登入按鈕...');
    await page.click('button[type="submit"]');
    
    console.log('等待頁面跳轉至 Dashboard...');
    // 等待跳轉到包含 /dashboard 的網址
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000)); // 多等幾秒載入 mock 資料與動畫

    const pagesToScreenshot = [
      {
        name: 'dashboard',
        title: '系統儀表板 (Dashboard)',
        url: `${baseUrl}/dashboard`,
        selector: 'body'
      },
      {
        name: 'members',
        title: '會友與成員管理 (Member Management)',
        url: `${baseUrl}/dashboard/members`,
        selector: 'body'
      },
      {
        name: 'organization',
        title: '組織架構與小組管理 (Organization & Group Management)',
        url: `${baseUrl}/dashboard/organization`,
        selector: 'body'
      },
      {
        name: 'templates',
        title: '課程模板設定 (Course Templates)',
        url: `${baseUrl}/dashboard/courses/templates`,
        selector: 'body'
      },
      {
        name: 'classes',
        title: '實體開班與學員管理 (Course Classes)',
        url: `${baseUrl}/dashboard/courses/classes`,
        selector: 'body'
      },
      {
        name: 'roles',
        title: '角色與權限定義 (Role & Permission Management)',
        url: `${baseUrl}/dashboard/roles`,
        selector: 'body'
      }
    ];

    const capturedPages = [];

    for (const p of pagesToScreenshot) {
      console.log(`前往頁面: ${p.title} (${p.url})...`);
      try {
        await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 15000 });
        // 多等 4 秒讓 PrimeVue 的資料跟 Firebase Emulator 完全同步渲染
        await new Promise(r => setTimeout(r, 4000));
        
        const imgPath = path.join(tempDir, `${p.name}.png`);
        await page.screenshot({ path: imgPath, fullPage: false });
        console.log(`✓ 截圖成功: ${imgPath}`);

        // 轉為 Base64
        const imgBase64 = fs.readFileSync(imgPath).toString('base64');
        capturedPages.push({
          ...p,
          base64: `data:image/png;base64,${imgBase64}`
        });
      } catch (err) {
        console.error(`✗ 擷取頁面 ${p.title} 失敗:`, err.message);
      }
    }

    console.log('生成 HTML 導覽報告中...');
    const htmlContent = generateHtmlReport(capturedPages);
    const htmlPath = path.join(tempDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent);

    console.log('將 HTML 導覽轉換為 PDF 檔案...');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const pdfPath = path.join(__dirname, '../docs/開發相關文件/NHECC-CHMS_超級管理員功能導覽.pdf');
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
      headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #94a3b8; font-family: Inter, sans-serif;">NHECC-CHMS 系統功能導覽手冊</div>',
      footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #94a3b8; font-family: Inter, sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    console.log(`\n🎉 PDF 報告已成功生成至: ${pdfPath}\n`);

  } catch (error) {
    console.error('執行過程出錯:', error);
    try {
      const errorHtml = await page.content();
      fs.writeFileSync(path.join(__dirname, '../docs/error-debug.html'), errorHtml);
      await page.screenshot({ path: path.join(__dirname, '../docs/error-screenshot.png') });
      console.log('已儲存出錯時的 HTML 於 docs/error-debug.html，以及截圖於 docs/error-screenshot.png');
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
      case 'dashboard':
        featureDesc = `
          <ul>
            <li><strong>數據可視化統計：</strong>整合系統所有核心指標，提供管理團隊即時的全域狀況掌握。</li>
            <li><strong>快速捷徑功能：</strong>提供最常用功能的直達入口，簡化日常行政作業流程。</li>
            <li><strong>待辦事項與重要提醒：</strong>展示未處理的事項（如待分發成員、即將開課班級），以提升管理效率。</li>
          </ul>
        `;
        break;
      case 'members':
        featureDesc = `
          <ul>
            <li><strong>全域成員清單管理：</strong>提供超級管理員對所有成員資料進行查詢、篩選、匯出等管理操作。</li>
            <li><strong>詳細會友資料卡：</strong>包含基本資料、洗禮狀態（洗禮日期）、緊急聯絡人資訊、以及歷年修課紀錄。</li>
            <li><strong>角色與功能組指派：</strong>可直接在此頁面為會友修改系統角色（如小組長、教師），或指派特定的功能服事小組（如詩班、財務組、媒體組等）。</li>
          </ul>
        `;
        break;
      case 'organization':
        featureDesc = `
          <ul>
            <li><strong>牧區 (Zones) 與小組 (Groups) 層級架構：</strong>直觀展示教會的多層級牧養組織架構。</li>
            <li><strong>未分配成員分發機制：</strong>顯示尚未指派至特定牧區或小組的新朋友，管理員可一鍵進行分派。</li>
            <li><strong>小組成員移出與調動：</strong>支援將成員從現有小組「移出 (Unassign)」退回未分配狀態，以便調動至其他小組。</li>
          </ul>
        `;
        break;
      case 'templates':
        featureDesc = `
          <ul>
            <li><strong>課程分類與目錄設定：</strong>維護系統所有的課程分類，建立階層化的培育課程地圖。</li>
            <li><strong>課程模板定義 (Templates)：</strong>設定各課程的標準大綱、代碼、建議修課時數、頻率，以及**先修課程限制 (Prerequisites)**，作為各班級開設時的依據。</li>
            <li><strong>模板關聯性防護：</strong>確保開班後模板與實體班級之間的資料結構安全性與連動關係。</li>
          </ul>
        `;
        break;
      case 'classes':
        featureDesc = `
          <ul>
            <li><strong>實體開班管理：</strong>依據課程模板開設實體班級，設定上課導師、上課時間以及名額限制。</li>
            <li><strong>防呆開課限制：</strong>系統自動防止報名已經開課的班級，並加強開班防衝突判斷。</li>
            <li><strong>班級狀態控制：</strong>支援「開課 (Start)」與「結課 (Conclude)」控制，並具備優雅的狀態過渡效果。</li>
            <li><strong>學員名冊與點名：</strong>管理每班報名學員的名冊，並提供導師進行課堂點名的快速入口。</li>
          </ul>
        `;
        break;
      case 'roles':
        featureDesc = `
          <ul>
            <li><strong>精細的 RBAC 角色與權限設定：</strong>定義不同系統角色（如牧區長、小組長、教師、超級管理員）的權限。</li>
            <li><strong>資料管轄範圍 (DataScope)：</strong>設定各角色的資料讀寫範圍，例如 GLOBAL（全域）、MY_ZONE（所轄牧區）、MY_GROUP（所轄小組）、SELF（個人）。</li>
            <li><strong>功能性權限矩陣：</strong>自訂角色是否具備特定管理功能（如會友編輯、開班管理、角色編輯）的權限。</li>
          </ul>
        `;
        break;
    }

    return `
      <div class="section-card page-break">
        <h2>${p.title}</h2>
        <div class="description-box">
          <h3>核心管理功能</h3>
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
      <title>NHECC-CHMS 系統功能導覽手冊</title>
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
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
        }

        .cover-logo {
          width: 120px;
          height: 120px;
          margin-bottom: 30px;
        }

        .cover-title {
          font-size: 38px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .cover-subtitle {
          font-size: 20px;
          color: #475569;
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
          border-left: 5px solid #2563eb;
          padding-left: 12px;
          margin-bottom: 20px;
          color: #1e3a8a;
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
          <path d="M12 2L2 22H22L12 2Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/>
          <path d="M12 7V17M7 12H17" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="cover-title">NHECC-CHMS</div>
        <div class="cover-subtitle">系統功能導覽手冊 (超級管理員專屬)</div>
        <div class="cover-meta">
          <p>產出對象：超級管理員 (Super Admin)</p>
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
