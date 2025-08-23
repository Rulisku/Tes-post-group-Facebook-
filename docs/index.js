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

  / 2. Tunggu sampai "Write something..." muncul
  await page.waitForSelector("span", { timeout: 15000 });

  // 3. Cari elemen composer (pakai evaluate di browser context)
  await page.evaluate(() => {
    const span = [...document.querySelectorAll("span")]
      .find(e => e.innerText?.toLowerCase().includes("write something")
              || e.innerText?.toLowerCase().includes("tulis sesuatu"));

    if (!span) {
      console.log("❌ Tidak ketemu tombol composer");
      return;
    }

    let el = span.closest("div[data-mcomponent='TextArea']")
             || span.closest("div[role='textbox']")
             || span.parentElement;

    if (!el) {
      console.log("❌ Tidak ketemu elemen klik");
      return;
    }

    ["mousedown","mouseup","click"].forEach(type => {
      el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
    });

    console.log("✅ Composer dibuka aman 👍");
  });

  // 4. Tunggu textbox aktif (role="textbox" muncul)
  await page.waitForSelector("div[role='textbox']", { timeout: 10000 });

  // 5. Isi caption
  await page.type("div[role='textbox']", "Halo ini posting otomatis dari Puppeteer 🚀");

  // 6. Klik tombol Post
  const postButton = await page.$x("//span[contains(text(),'Post') or contains(text(),'Kirim')]");
  if (postButton.length) {
    await postButton[0].click();
    console.log("✅ Post berhasil diklik");
  } else {
    console.log("❌ Tombol Post tidak ditemukan");
  }

  // await browser.close();
})();
  }
