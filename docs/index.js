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
await new Promise(resolve => setTimeout(resolve, 3000));

(async function(){
  // cari tombol "Write something" di dalam composer
  const btn = [...document.querySelectorAll("div[role='button']")]
    .find(el => el.innerText?.toLowerCase().includes("write something") 
             || el.innerText?.toLowerCase().includes("buat postingan"));

  if (!btn) {
    console.log("❌ Placeholder 'Write something' tidak ditemukan");
    return;
  }

  // klik tombol supaya FB ganti jadi textbox textarea
  ["mousedown","mouseup","click"].forEach(type => {
    btn.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
  });

  console.log("👉 Klik placeholder berhasil, tunggu textbox muncul...");

  // tunggu 1 detik biar DOM update
  setTimeout(() => {
    const tb = document.querySelector("textarea[name='xc_message'], textarea");
    if (tb) {
      tb.focus();
      tb.value = caption;
      tb.dispatchEvent(new Event("input", { bubbles:true }));
      tb.dispatchEvent(new Event("change", { bubbles:true }));
      console.log("✅ Caption berhasil diisi:", tb.value);
    } else {
      console.log("❌ Textarea masih tidak muncul");
    }
  }, 3000);
})();
  // Klik tombol Post / Kirim
  // Cari tombol POST berdasarkan teks
const span = [...document.querySelectorAll("span")]
  .find(e => e.innerText?.toLowerCase() === "post");

if (span) {
  console.log("✅ Dapat elemen span POST:", span);

  // cari parent terdekat yang bisa di-klik
  let el = span.closest("div[role=button], div[data-mcomponent], div[tabindex]");
  if (!el) el = span.parentElement;

  console.log("Target klik:", el);

  // Trigger event seperti klik nyata agar React/Vue terpicu
  ["mousedown","mouseup","click"].forEach(type => {
    el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
  });

  ["touchstart","touchend"].forEach(type => {
    el.dispatchEvent(new TouchEvent(type, { bubbles:true, cancelable:true }));
  });

  console.log("✅ Event dikirim ke elemen POST");
} else {
  console.log("❌ Tidak ketemu tombol POST");
}


  await browser.close();
})();
