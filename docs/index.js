const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  const groupUrl = 'https://m.facebook.com/groups/1612669432331653/';
  const caption = 'Halo, ini posting otomatis dari Puppeteer versi mobile!';

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 412,
      height: 915,
      isMobile: true,
      hasTouch: true
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // 🟢 Samakan User-Agent dengan Chrome Android (sama kayak di Kiwi)
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
  );

  // Set cookies
  await page.setCookie(...cookies);

  // Buka m.facebook.com
  await page.goto('https://m.facebook.com', { waitUntil: 'networkidle2' });

  // Buka grup
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // klik "Write something"
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("div[role='button']")]
    .find(el => el.innerText?.toLowerCase().includes("write something") 
             || el.innerText?.toLowerCase().includes("buat postingan"));
  if (btn) {
    ["mousedown","mouseup","click"].forEach(type => {
      btn.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
    });
  }
});

// kasih delay 3s biar composer sempat render
await page.waitForTimeout(3000);

// selector lebih luas
const composerSelector = "textarea[name='xc_message'], textarea, div[role='textbox'], div.native-text[contenteditable='true']";
const textBox = await page.waitForSelector(composerSelector, { timeout: 15000 }).catch(() => null);

if (!textBox) {
  console.log("❌ Textbox tidak ketemu, dump HTML");
  const html = await page.content();
  require('fs').writeFileSync("debug.html", html);
  process.exit(1);
}

// isi caption via evaluate
await page.evaluate((caption, selector) => {
  const tb = document.querySelector(selector);
  if (tb) {
    tb.focus();
    tb.innerText = caption;
    tb.value = caption;
    tb.dispatchEvent(new Event("input", { bubbles: true }));
    tb.dispatchEvent(new Event("change", { bubbles: true }));
  }
}, caption, composerSelector);

console.log("✅ Caption berhasil dimasukkan");

  // Klik tombol Post / Kirim
  const [postButton] = await page.$x("//span[contains(text(),'Post') or contains(text(),'Kirim')]");
  if (postButton) {
    await postButton.click();
    console.log("✅ Post berhasil dikirim");
  } else {
    console.log("❌ Tombol Post tidak ditemukan");
  }

  await browser.close();
})();
