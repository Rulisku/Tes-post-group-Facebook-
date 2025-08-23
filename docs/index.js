const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Load cookies dari file
  const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  // Data posting
  const groupUrl = 'https://m.facebook.com/groups/1612669432331653/';
  const caption = 'Halo, ini posting otomatis dari Puppeteer!';

  const browser = await puppeteer.launch({
    headless: true, // false kalau mau lihat debug
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set cookies
  await page.setCookie(...cookies);

  // Buka Facebook
  await page.goto('https://m.facebook.com', { waitUntil: 'networkidle2' });

  // Buka grup
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // Klik tombol "Write something..." (placeholder composer)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("div[role='button']")]
      .find(el => el.innerText?.toLowerCase().includes("write something") 
               || el.innerText?.toLowerCase().includes("buat postingan"));

    if (btn) {
      ["mousedown","mouseup","click"].forEach(type => {
        btn.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
      });
      console.log("👉 Klik placeholder berhasil");
    }
  });

  // Tunggu textbox composer muncul
  await page.waitForSelector("textarea[name='xc_message'], textarea", { timeout: 10000 });

  // Isi caption langsung dari evaluate (agar event FB ter-trigger)
  await page.evaluate((caption) => {
    const tb = document.querySelector("textarea[name='xc_message'], textarea");
    if (tb) {
      tb.focus();
      tb.value = caption;
      tb.dispatchEvent(new Event("input", { bubbles:true }));
      tb.dispatchEvent(new Event("change", { bubbles:true }));
    }
  }, caption);

  console.log("✅ Caption berhasil dimasukkan");

  // Klik tombol Post
  const [postButton] = await page.$x("//span[contains(text(),'Post') or contains(text(),'Kirim')]");
  if (postButton) {
    await postButton.click();
    console.log("✅ Post berhasil diklik");
  } else {
    console.log("❌ Tombol Post tidak ditemukan");
  }

  // await browser.close();
})();
