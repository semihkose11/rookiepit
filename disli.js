/* Disli menusu: hesap ve gezinme araclari her sayfada ayni yerde toplanir.
   Modul sayfalarinda yuklenmez; orada sol ustteki menu kullanilir.
   Kullanim: FRC_DISLI.kur(kutu, kullanici, {buSayfa:"moduller.html", cikis:"yenile"})
   kutu     : dislinin ekleneceği oge
   kullanici: FRC.hazir'dan gelen {ad, eposta, rol}
   buSayfa  : acik olan sayfanin dosya adi; kendi baglantisi listelenmez
   ust      : true ise disli sayfanin en ustune, sag kosede sabitlenir
   cikis    : "yenile" ise cikista sayfa yenilenir, degilse giris.html'e gidilir */
(function () {
  "use strict";

  var STIL = ''
    + '.dsar{position:relative;display:inline-block}'
    /* ust: soldaki menu dugmesinin karsisi, sayfanin en ustu */
    + '.dsar.ust{position:fixed;right:14px;top:10px;z-index:70}'
    + '.disli{width:48px;height:48px;display:flex;align-items:center;justify-content:center;'
    + 'background:var(--surface,#fff);border:1px solid var(--hair,#e5e5e5);border-radius:999px;'
    + 'cursor:pointer;padding:0}'
    + '.disli:hover{background:var(--sunk,#f4f4f5);border-color:var(--acc,#6d28d9)}'
    + '.disli:focus-visible{outline:2px solid var(--acc,#6d28d9);outline-offset:2px}'
    + '.disli svg{width:23px;height:23px;display:block;fill:none;stroke:var(--ink,#111);'
    + 'stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
    + '.dmenu{position:absolute;right:0;top:calc(100% + 8px);z-index:60;min-width:224px;'
    + 'max-width:calc(100vw - 16px);'
    + 'text-align:left;background:var(--surface,#fff);border:1px solid var(--hair,#e5e5e5);'
    + 'border-radius:14px;padding:7px;box-shadow:0 18px 40px rgba(0,0,0,.14)}'
    + '.dmenu[hidden]{display:none}'
    + '.dkim{padding:8px 11px 10px;border-bottom:1px solid var(--hair,#e5e5e5);margin-bottom:6px}'
    + '.dkim b{display:block;font:600 14px/1.35 var(--sans,system-ui);color:var(--ink,#111)}'
    + '.dkim span{font:500 11.5px/1.5 var(--mono,ui-monospace);color:var(--mute,#666);'
    + 'overflow-wrap:anywhere}'
    + '.dmenu a,.dmenu button{display:block;width:100%;text-align:left;box-sizing:border-box;'
    + 'font:500 14.5px/1.25 var(--sans,system-ui);color:var(--body,#333);background:none;'
    + 'border:0;border-radius:9px;padding:10px 11px;cursor:pointer;text-decoration:none}'
    + '.dmenu a:hover,.dmenu button:hover{background:var(--acc-soft,#f3eaff);color:var(--acc,#6d28d9)}'
    + '.dmenu a:focus-visible,.dmenu button:focus-visible{outline:2px solid var(--acc,#6d28d9);'
    + 'outline-offset:-2px}'
    + '.dayir{height:1px;background:var(--hair,#e5e5e5);margin:6px 4px}'
    + '.dcik{color:var(--no,#b42318)}'
    + '.dcik:hover{background:var(--no-soft,#fdecea);color:var(--no,#b42318)}';

  var CARK = '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<circle cx="12" cy="12" r="3.1"></circle>'
    + '<path d="M19.2 14.4a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05'
    + 'a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V20a1.8 1.8 0 1 1-3.6 0v-.1'
    + 'a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05a1.8 1.8 0 1 1-2.55-2.55'
    + 'l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4a1.8 1.8 0 1 1 0-3.6h.1'
    + 'a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05a1.8 1.8 0 1 1 2.55-2.55'
    + 'l.05.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V4a1.8 1.8 0 1 1 3.6 0v.1'
    + 'a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55'
    + 'l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9H20a1.8 1.8 0 1 1 0 3.6h-.1'
    + 'a1.5 1.5 0 0 0-1.37.9z"></path></svg>';

  var stilEklendi = false;
  function stil() {
    if (stilEklendi) return;
    var s = document.createElement("style");
    s.setAttribute("data-disli", "1");
    s.textContent = STIL;
    document.head.appendChild(s);
    stilEklendi = true;
  }

  /* Eski 'koc' degeri mentor sayilir. */
  function yetkiliMi(r) { return r === "mentor" || r === "admin" || r === "koc"; }
  function etiket(r) {
    if (r === "admin") return "admin";
    return yetkiliMi(r) ? "mentör" : "öğrenci";
  }

  function kur(kutu, k, secenek) {
    if (!kutu || !k) return null;
    secenek = secenek || {};
    var bu = secenek.buSayfa || "";
    stil();

    var sar = document.createElement("div");
    sar.className = secenek.ust ? "dsar ust" : "dsar";

    var d = document.createElement("button");
    d.className = "disli"; d.id = "disli"; d.type = "button";
    d.setAttribute("aria-label", "Menü");
    d.setAttribute("aria-haspopup", "true");
    d.setAttribute("aria-expanded", "false");
    d.setAttribute("aria-controls", "dmenu");
    d.innerHTML = CARK;

    var m = document.createElement("div");
    m.className = "dmenu"; m.id = "dmenu"; m.hidden = true;
    m.setAttribute("role", "menu");

    var kim = document.createElement("div"); kim.className = "dkim";
    var kb = document.createElement("b"); kb.textContent = k.ad || ""; kim.appendChild(kb);
    var ke = document.createElement("span");
    ke.textContent = (k.eposta || "") + " · " + etiket(k.rol); kim.appendChild(ke);
    m.appendChild(kim);

    function madde(metin, adres) {
      if (adres === bu) return null;            /* acik sayfanin kendisi listelenmez */
      var a = document.createElement("a");
      a.href = adres; a.textContent = metin; a.setAttribute("role", "menuitem");
      m.appendChild(a); return a;
    }
    madde("Profil", "profil.html");
    /* Şifre maddesi öğrenci menüsünde görünmez; profil sayfasındaki
       düğme yerinde durur, oradan değiştirilebilir. */
    if (yetkiliMi(k.rol)) madde("Şifreyi değiştir", "profil.html#sifre");
    madde("Modüller", "moduller.html");
    if (yetkiliMi(k.rol)) {
      madde("Yönetim paneli", "admin.html");
      madde("Görevlendirme", "admin.html#yeni");
      madde("İlerleme tablosu", "koc.html");
    }

    var ayir = document.createElement("div"); ayir.className = "dayir"; m.appendChild(ayir);
    var cik = document.createElement("button");
    cik.type = "button"; cik.className = "dcik"; cik.id = "dcikis";
    cik.textContent = "Oturumu kapat";
    cik.setAttribute("role", "menuitem");
    cik.onclick = function () {
      cik.disabled = true;
      Promise.resolve(FRC.cikisYap()).then(function () {
        if (secenek.cikis === "yenile") location.reload();
        else location.replace("giris.html");
      });
    };
    m.appendChild(cik);

    function ac() {
      m.hidden = false; d.setAttribute("aria-expanded", "true");
      /* Dar ekranda disli sagda degilse menu sol kenardan tasabilir: geri cek. */
      m.style.left = ""; m.style.right = "0";
      var r = m.getBoundingClientRect();
      if (r.left < 8) {
        var a = sar.getBoundingClientRect();
        m.style.right = "auto";
        m.style.left = (8 - a.left) + "px";
      }
      var ilk = m.querySelector("a,button.dcik"); if (ilk) ilk.focus();
    }
    function kapat() { m.hidden = true; d.setAttribute("aria-expanded", "false"); }
    d.onclick = function (e) { e.stopPropagation(); m.hidden ? ac() : kapat(); };
    document.addEventListener("click", function (e) {
      if (!m.hidden && !sar.contains(e.target)) kapat();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !m.hidden) { kapat(); d.focus(); }
    });

    sar.appendChild(d); sar.appendChild(m);
    kutu.appendChild(sar);
    return sar;
  }

  window.FRC_DISLI = { kur: kur, etiket: etiket, yetkiliMi: yetkiliMi };
})();
