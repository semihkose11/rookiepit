/* =====================================================================
   FRC Çalışma Programı · çerez bildirimi ve üçüncü taraf onayı

   Bu dosya <head> içinde, diğer her şeyden önce yüklenir. İşi şudur:

   · Seçimi gerçek bir çerezde tutar: frc_cerez=kabul | red
   · Onay verilmeden Google Fonts isteği yapılmaz; yazı tipleri
     sistem yazı tipine düşer.
   · Onay verilmeden modül videolarının YouTube önizlemesi yüklenmez;
     videolar bağlantı olarak görünür (window.__EMBED__ bunu okur).
   · Programın kendi işleyişi için gereken oturum ve ilerleme kaydı
     localStorage'da tutulur ve onaya bağlı değildir; kapatılırsa
     program kullanılamaz hâle gelir.
   · Her girişte ad, e-posta ve saat sunucuya kaydedilir. Bu bir
     güvenlik kaydıdır, onaya bağlı değildir ve kutuda bildirilir.

   Onay geri alınabilir: FRC_CEREZ.ayarlar() kutuyu yeniden açar.
   ===================================================================== */
(function () {
  "use strict";

  var AD = "frc_cerez";
  var YIL = 31536000;                       /* saniye: 365 gün */
  var FONT = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700"
           + "&family=IBM+Plex+Mono:wght@400;500;600"
           + "&family=IBM+Plex+Sans:wght@400;500;600&display=swap";

  function cerezOku(ad) {
    var p = ("; " + document.cookie).split("; " + ad + "=");
    return p.length === 2 ? decodeURIComponent(p.pop().split(";").shift()) : null;
  }
  function cerezYaz(ad, deger) {
    var guvenli = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = ad + "=" + encodeURIComponent(deger)
      + "; path=/; max-age=" + YIL + "; SameSite=Lax" + guvenli;
  }
  function cerezSil(ad) {
    document.cookie = ad + "=; path=/; max-age=0; SameSite=Lax";
  }

  /* ---- tema -------------------------------------------------------
     Seçim tarayıcıda tutulur: frc_tema = acik | koyu | sistem.
     Bu dosya <head> içinde çalıştığı için sayfa boyanmadan önce
     uygulanır; koyu temada açık bir kare görünüp kaybolmaz.
     Renkler sayfaların kendi değişkenleri üzerine yazılır, böylece
     45 sayfanın hiçbirine dokunmak gerekmez.                        */
  var TEMA_ANAHTARI = "frc_tema";

  var KOYU = ''
    + ':root[data-tema="koyu"]{color-scheme:dark;'
    + '--ground:#171126;--surface:#221A38;--sunk:#2E2449;'
    + '--ink:#FFFFFF;--body:#EBE4FA;--mute:#B2A3D6;--hair:#453869;'
    + '--acc:#C9AEFF;--acc-soft:#342856;'
    + '--ok:#7EDCA8;--ok-soft:#1B3328;'
    + '--no:#FF9ABA;--no-soft:#3E1A31;'
    + '--warn:#F2C572;--warn-soft:#3B2E1E;'
    + '--elec:#F0A95C;--elec-soft:#3A2A14;'
    + '--prog:#72D2E6;--prog-soft:#123039;'
    + '--cad:#C3A6FF;--cad-soft:#2C2340;'
    + '--shadow:0 1px 2px rgba(0,0,0,.55),0 10px 28px rgba(0,0,0,.45)}'
    /* Zemini --ink olan düğmelerde yazı rengi sabit beyazdı; koyu temada
       --ink beyaza döndüğü için yazı okunmaz hâle geliyordu. */
    + ':root[data-tema="koyu"] .btn.solid,'
    + ':root[data-tema="koyu"] .go,'
    + ':root[data-tema="koyu"] button.go,'
    + ':root[data-tema="koyu"] .gb.solid,'
    + ':root[data-tema="koyu"] .num,'
    + ':root[data-tema="koyu"] .step .no,'
    + ':root[data-tema="koyu"] .tab[aria-selected="true"],'
    + ':root[data-tema="koyu"] .fbtn[aria-pressed="true"],'
    + ':root[data-tema="koyu"] .czg{color:var(--ground)}'
    + ':root[data-tema="koyu"] .go.ikincil,'
    + ':root[data-tema="koyu"] .czg.ikincil{color:var(--body)}'
    /* Sabit beyaz zeminler */
    + ':root[data-tema="koyu"] input:focus,'
    + ':root[data-tema="koyu"] select:focus,'
    + ':root[data-tema="koyu"] textarea:focus,'
    + ':root[data-tema="koyu"] .puanla input{background:var(--surface)}'
    + ':root[data-tema="koyu"] .gkart.bitti,'
    + ':root[data-tema="koyu"] li.mod.pass{background:var(--surface)}'
    + ':root[data-tema="koyu"] .sagust{background:rgba(34,26,56,.84)}'
    /* Şemalar açık zemine göre çizildi; koyu temada beyaz bir kart
       üzerinde gösterilir, yoksa çizgiler kayboluyor. */
    + ':root[data-tema="koyu"] figure svg,'
    + ':root[data-tema="koyu"] .sema svg{background:#FFFFFF;border-radius:10px}';

  function temaOku() {
    try {
      var t = localStorage.getItem(TEMA_ANAHTARI);
      return (t === "acik" || t === "koyu" || t === "sistem") ? t : "acik";
    } catch (e) { return "acik"; }
  }
  function sistemKoyu() {
    try { return !!(window.matchMedia && matchMedia("(prefers-color-scheme:dark)").matches); }
    catch (e) { return false; }
  }
  function temaUygula(secim) {
    var koyu = secim === "koyu" || (secim === "sistem" && sistemKoyu());
    var k = document.documentElement;
    k.setAttribute("data-tema", koyu ? "koyu" : "acik");
    k.setAttribute("data-tema-secim", secim);
  }
  function temaStili() {
    if (document.getElementById("frc-tema")) return;
    var s = document.createElement("style");
    s.id = "frc-tema"; s.textContent = KOYU;
    (document.head || document.documentElement).appendChild(s);
  }
  temaStili();
  temaUygula(temaOku());
  try {
    var mq = window.matchMedia && matchMedia("(prefers-color-scheme:dark)");
    if (mq && mq.addEventListener)
      mq.addEventListener("change", function () {
        if (temaOku() === "sistem") temaUygula("sistem");
      });
  } catch (e) {}

  window.FRC_TEMA = {
    al: temaOku,
    koyuMu: function () { return document.documentElement.getAttribute("data-tema") === "koyu"; },
    ayarla: function (secim) {
      if (secim !== "acik" && secim !== "koyu" && secim !== "sistem") return;
      try { localStorage.setItem(TEMA_ANAHTARI, secim); } catch (e) {}
      temaUygula(secim);
    }
  };

  var onay = cerezOku(AD);
  if (onay !== "kabul" && onay !== "red") onay = null;

  var FRC_CEREZ = {
    onay: onay,
    kabulEdildi: onay === "kabul",
    ayarlar: function () { kutuAc(true); }
  };
  window.FRC_CEREZ = FRC_CEREZ;

  /* Modül sayfaları bu bayrağı okuyor: onay yoksa YouTube'a istek gitmez. */
  window.__EMBED__ = (onay === "kabul");

  function yaziTipiYukle() {
    if (document.getElementById("frc-font")) return;
    var l = document.createElement("link");
    l.id = "frc-font"; l.rel = "stylesheet"; l.href = FONT;
    document.head.appendChild(l);
  }
  if (onay === "kabul") yaziTipiYukle();

  /* ---- kutunun görünümü ------------------------------------------- */
  var CSS = ''
    + '.cz{position:fixed;left:0;right:0;bottom:0;z-index:120;padding:14px;'
    + 'display:flex;justify-content:flex-start;pointer-events:none}'
    + '.czk{pointer-events:auto;max-width:420px;background:var(--surface,#fff);'
    + 'border:1px solid var(--hair,#CFC2EC);border-radius:14px;padding:16px 18px 15px;'
    + 'box-shadow:0 2px 6px rgba(40,24,80,.10),0 14px 40px rgba(40,24,80,.16)}'
    + '.czb{font:600 11px/1 var(--mono,ui-monospace,monospace);letter-spacing:.11em;'
    + 'text-transform:uppercase;color:var(--acc,#5B21B6);margin:0 0 9px}'
    + '.czm{margin:0;font:400 13.5px/1.62 var(--sans,system-ui,sans-serif);'
    + 'color:var(--body,#141019)}'
    + '.czm b{font-weight:600}'
    + '.czd{margin:9px 0 0;font:400 12.5px/1.6 var(--sans,system-ui,sans-serif);'
    + 'color:var(--mute,#463E58)}'
    + '.czs{margin:13px 0 0;display:flex;gap:8px;flex-wrap:wrap}'
    + '.czg{font:600 13px/1 var(--sans,system-ui,sans-serif);padding:10px 15px;'
    + 'border-radius:999px;border:1px solid var(--ink,#000);background:var(--ink,#000);'
    + 'color:#fff;cursor:pointer}'
    + '.czg.ikincil{background:var(--surface,#fff);color:var(--ink,#000);'
    + 'border-color:var(--hair,#CFC2EC)}'
    + '.czg:hover{opacity:.9}'
    + '.czg:focus-visible{outline:2px solid var(--acc,#5B21B6);outline-offset:2px}'
    + '@media (max-width:560px){.cz{padding:10px}.czk{max-width:none}}'
    + '@media print{.cz{display:none}}';

  function stilEkle() {
    if (document.getElementById("cz-stil")) return;
    var s = document.createElement("style");
    s.id = "cz-stil"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  var kutu = null;

  function kapat() {
    if (kutu && kutu.parentNode) kutu.parentNode.removeChild(kutu);
    kutu = null;
  }

  function sec(deger) {
    cerezYaz(AD, deger);
    FRC_CEREZ.onay = deger;
    FRC_CEREZ.kabulEdildi = (deger === "kabul");
    kapat();
    if (deger === "kabul") {
      yaziTipiYukle();
      /* Video önizlemeleri sayfa çizilirken karara göre kuruluyor;
         kabulden sonra görünmeleri için sayfa yenilenir. */
      if (document.getElementById("vids")) location.reload();
    } else {
      window.__EMBED__ = false;
    }
  }

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  function kutuAc(zorla) {
    if (!zorla && FRC_CEREZ.onay) return;
    if (kutu) return;
    stilEkle();

    kutu = el("div", "cz");
    kutu.setAttribute("role", "dialog");
    kutu.setAttribute("aria-label", "Çerez bildirimi");
    var k = el("div", "czk");

    k.appendChild(el("p", "czb", "Çerez ve tarayıcı kaydı"));

    var m = el("p", "czm");
    m.appendChild(el("b", null, "Bu site izleme veya reklam çerezi kullanmaz."));
    m.appendChild(document.createTextNode(
      " Oturumunuz ve modül ilerlemeniz, program çalışsın diye tarayıcınıza"
      + " kaydedilir; bu kayıt olmadan program kullanılamaz. Seçiminizi"
      + " hatırlayan bir çerez de yazılır. Hesabınızla her girişinizde adınız,"
      + " e-postanız ve giriş saatiniz kaydedilir; bu kayıt programın"
      + " güvenlik kaydıdır ve mentörler görür."));
    k.appendChild(m);

    k.appendChild(el("p", "czd",
      "Kabul ederseniz yazı tipleri Google Fonts'tan, modül videolarının"
      + " önizlemeleri YouTube'dan yüklenir. Reddederseniz sistem yazı tipi"
      + " kullanılır ve videolar yalnızca bağlantı olarak görünür."));

    var s = el("div", "czs");
    var kab = el("button", "czg", "Kabul et");
    kab.type = "button";
    kab.onclick = function () { sec("kabul"); };
    var red = el("button", "czg ikincil", "Reddet");
    red.type = "button";
    red.onclick = function () { sec("red"); };
    s.appendChild(kab); s.appendChild(red);

    if (zorla && FRC_CEREZ.onay) {
      var sifirla = el("button", "czg ikincil", "Seçimi sil");
      sifirla.type = "button";
      sifirla.onclick = function () {
        cerezSil(AD);
        FRC_CEREZ.onay = null; FRC_CEREZ.kabulEdildi = false;
        kapat();
      };
      s.appendChild(sifirla);
    }
    k.appendChild(s);

    kutu.appendChild(k);
    document.body.appendChild(kutu);
    kab.focus();
  }

  function hazir(f) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", f);
    } else { f(); }
  }
  hazir(function () { kutuAc(false); });
})();
