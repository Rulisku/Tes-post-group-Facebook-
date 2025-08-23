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

  // Buka Facebook.com dulu untuk pastikan login
  await page.goto('https://facebook.com', { waitUntil: 'networkidle2' });

  // Buka grup Facebook
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // Langkah 1: Klik area "Write something..." di feed grup
  await page.waitForSelector('div[aria-label="Write something..."], div[role="textbox"][aria-label="Write something..."]', {timeout: 10000});
  await page.click('div[aria-label="Write something..."], div[role="textbox"][aria-label="Write something..."]');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Langkah 2: Tunggu form posting muncul, isi caption di kotak besar
  await page.waitForSelector('div[contenteditable="true"]', {timeout: 10000});
  await page.focus('div[contenteditable="true"]');
  await page.keyboard.type(caption);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Klik tombol POST (atas atau bawah)
  const postSelector = 'div[aria-label="Post"], button[type="submit"], div[role="button"][aria-label="POST"], div[role="button"][aria-label="Post"]';
  await page.waitForSelector(postSelector, {timeout: 10000});
  await page.click(postSelector);

  console.log('✅ Posted to group!');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();
