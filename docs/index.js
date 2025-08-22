const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Load cookies dari file (ganti path dengan file cookies-mu)
  
const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  // Data posting (ganti sesuai kebutuhan)
  const groupUrl = 'https://facebook.com/groups/220865376056610/';
  const caption = 'Halo, ini posting otomatis dari Puppeteer!';

  const browser = await puppeteer.launch({
    headless: true, // Biar bisa lihat prosesnya
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});

  const page = await browser.newPage();

  // Set cookies
  await page.setCookie(...cookies);

  // Buka grup Facebook
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // Klik area "Write something"
  await page.evaluate(() => {
    const writeBtn = document.querySelector('span[class*="Write something"], span[class*="Tulis sesuatu"]');
    if (writeBtn) writeBtn.click();
  });
  
await new Promise(resolve => setTimeout(resolve, 1000));
  // Isi caption
  await page.evaluate((text) => {
    const textbox = document.querySelector('[contenteditable="true"]');
    if (textbox) {
      textbox.focus();
      document.execCommand('insertText', false, text);
      textbox.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, caption);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Klik tombol "Post"
  await page.evaluate(() => {
    // Coba cari tombol "Post" atau "Kirim"
    const postBtn = document.querySelector('button[type=submit], [aria-label="Post"], [aria-label="Kirim"]');
    if (postBtn) postBtn.click();
  });

  console.log('✅ Posted to group!');
  await new Promise(resolve => setTimeout(resolve, 1000));  
  await browser.close();
})();
