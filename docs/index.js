const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Load cookies dari file (ganti path dengan file cookies-mu)
  const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  // Data posting (ganti sesuai kebutuhan)
  const groupUrl = 'https://facebook.com/groups/1612669432331653/';
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

  // Klik tombol "Write something..." dulu
await page.evaluate(() => {
  const span = [...document.querySelectorAll("span")]
    .find(e => e.innerText?.toLowerCase().includes("write something"));

  if (span) {
    console.log("✅ Dapat elemen span Write something:", span);

    // cari parent terdekat yang bisa di-klik
    let el = span.closest("div[role=button], div[data-mcomponent], div[tabindex]");
    if (!el) el = span.parentElement;

    // Coba berbagai event supaya React terpicu
    ["mousedown","mouseup","click"].forEach(type => {
      el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
    });

    ["touchstart","touchend"].forEach(type => {
      el.dispatchEvent(new TouchEvent(type, { bubbles:true, cancelable:true }));
    });
  }
});


  // Tunggu sampai textbox muncul setelah klik "Write something..."
const textBox = await page.waitForSelector(
  "div[role='textbox'], textarea[name='xc_message'], div[contenteditable='true']",
  { timeout: 10000 }
);
  // 5. Isi caption
  await page.type("div[role='textbox']", caption);

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
