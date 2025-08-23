const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Load cookies dari file (ganti path dengan file cookies-mu)
  const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  // Data posting (ganti sesuai kebutuhan)
  const groupUrl = 'https://facebook.com/groups/220865376056610/';
  const caption = 'Halo, ini posting otomatis dari Puppeteer!';

  const browser = await puppeteer.launch({
    headless: true, // true = tidak kelihatan, false = debug mode
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set cookies
  await page.setCookie(...cookies);

  // Buka Facebook.com dulu untuk pastikan login
  await page.goto('https://facebook.com', { waitUntil: 'networkidle2' });

  // Buka grup Facebook
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // Step 1: buka composer ("Write something...")
  await openComposer(page);

  // Step 2: isi caption & klik tombol Post
  await typeCaption(page, caption);

  console.log('✅ Posted to group!');
  await browser.close();
})();

// ----------------- Helper Functions -----------------

async function openComposer(page) {
  try {
    const btnSel = '[aria-label="Write something..."], [aria-label="Tulis sesuatu..."]';
    await page.waitForSelector(btnSel, { timeout: 5000 });
    await page.click(btnSel);
    console.log("✅ Composer dibuka (klik tombol Write something)");
  } catch {
    // fallback cari text
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('div, span')]
        .find(e => e.innerText?.includes("Write something") || e.innerText?.includes("Tulis sesuatu"));
      if (el) el.click();
    });
    console.log("✅ Composer dibuka (fallback innerText)");
  }
  await new Promise(resolve => setTimeout(resolve, 2000)); await browser.close(); })(); // tunggu composer muncul
}

async function typeCaption(page, text) {
  try {
    const boxSel = 'div[role="textbox"], [contenteditable="true"]';
    await page.waitForSelector(boxSel, { timeout: 5000 });
    await page.type(boxSel, text, { delay: 50 });
    console.log("✅ Caption berhasil ditulis");
  } catch {
    console.error("❌ Gagal menemukan textbox composer");
  }

  // Klik tombol POST
  const postSelector = 'div[aria-label="Post"], div[aria-label="Kirim"], button[type="submit"]';
  await page.waitForSelector(postSelector, { timeout: 10000 });
  await page.click(postSelector);
  console.log("✅ Klik tombol Post");
}
