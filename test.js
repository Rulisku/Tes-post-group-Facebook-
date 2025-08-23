//fungsi cari elemen write something Facebook 
//(function() {
  //const span = [...document.querySelectorAll("span")]
    //.find(e => e.innerText?.toLowerCase().includes("write something")
         //   || e.innerText?.toLowerCase().includes("tulis sesuatu"));

//  if (!span) {
  //  console.log("❌ Tidak ketemu tombol composer");
  //  return;
 // }

 // let el = span.closest("div[data-mcomponent='TextArea']")
         //  || span.closest("div[role='textbox']")
           //|| span.parentElement;

//  if (!el) {
   // console.log("❌ Tidak ketemu elemen klik");
   // return;
 // }

//  ["mousedown","mouseup","click"].forEach(type => {
   // el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
 // });

//  console.log("✅ Composer dibuka aman 👍");
//})();

// atau ini 
// Cari tombol "Write something..." by text
//const span = [...document.querySelectorAll("span")]
 // .find(e => e.innerText?.toLowerCase().includes("write something"));

//if (span) {
//  console.log("✅ Dapat elemen span Write something:", span);

  // cari parent terdekat yang bisa di-klik
  //let el = span.closest("div[role=button], div[data-mcomponent], div[tabindex]");
 // if (!el) el = span.parentElement;

  //console.log("Target klik:", el);

  // Coba berbagai event supaya React terpicu["mousedown","mouseup","click"].forEach(type => {
  //  el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window }));
 // });

//  ["touchstart","touchend"].forEach(type => {
   // el.dispatchEvent(new TouchEvent(type, { bubbles:true, cancelable:true }));
 // });

 // console.log("✅ Event dikirim ke elemen Write something");
//} else {
 // console.log("❌ Tidak ketemu teks Write something");
//}
// Cari tombol "Write something..." by text
