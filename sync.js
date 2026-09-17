/* =====================================================================
   FRC Çalışma Programı · giriş ve ilerleme katmanı

   Supabase'in REST ve auth uçlarına doğrudan fetch ile bağlanır;
   hiçbir dış kütüphane yüklemez. Bağlantı kurulamadığında veya
   config.js boş bırakıldığında program tarayıcı kaydıyla çalışmayı
   sürdürür, böylece internet kesintisi dersi durdurmaz.

   Dışarı açılan yüzey:
     FRC.hazir            oturum çözülene kadar bekleyen promise
     FRC.kullanici()      {id, ad, eposta, rol} veya null
     FRC.kayitOl(...)     yeni hesap
     FRC.girisYap(...)    oturum açma
     FRC.cikisYap()       oturumu kapatma
     FRC.korumaliSayfa()  oturum yoksa giriş sayfasına gönderir
     FRC.oku(modulKey)    bir modülün sunucudaki durumu
     FRC.hepsiniOku()     bütün modüllerin durumu
     FRC.tuvalYaz(...)    ilk tuval puanı
     FRC.cevapYaz(...)    bir sorunun ilk cevabı
   ===================================================================== */
(function () {
  "use strict";

  var C = window.FRC_CONFIG || {};
  var ACIK = !!(C.url && C.key);              /* sunucu yapılandırıldı mı */
  var OTURUM_ANAHTARI = "frc_oturum";
  var KUYRUK_ANAHTARI = "frc_kuyruk";
  var SAHIP_ANAHTARI = "frc_sahip";   /* yerel kaydin hangi hesaba ait oldugu */

  var oturum = null;    /* {access_token, refresh_token, expires_at, user} */
  var profil = null;    /* {id, ad, rol} */

  /* ---- küçük yardımcılar ------------------------------------------ */
  function yerelOku(k, varsayilan) {
    try { return JSON.parse(localStorage.getItem(k) || "null") || varsayilan; }
    catch (e) { return varsayilan; }
  }
  function yerelYaz(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function yerelSil(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---- hesap değişince yerel ilerlemeyi silme ---------------------- */
  /* Bir bilgisayarı birden çok öğrenci kullanabilir. Modül sayfaları
     cevapları tarayıcıya da kaydettiği için, hesap değiştiğinde önceki
     öğrencinin cevapları yeni öğrencide görünürdü. Modül kayıt
     anahtarları ep00..ep12, pp00..pp12 ve cp01..cp12 kalıbındadır;
     yalnızca bu kalıba uyanlar ve gönderilmemiş kuyruk silinir.
     Sunucudaki puanlar etkilenmez, onlar hesaba bağlıdır ve
     değiştirilemez. */
  var ILERLEME_KALIBI = /^(ep|pp|cp)\d{2}b?$/;

  function ilerlemeyiSil() {
    try {
      var atilacak = [], i, k;
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (k && ILERLEME_KALIBI.test(k)) atilacak.push(k);
      }
      for (i = 0; i < atilacak.length; i++) localStorage.removeItem(atilacak[i]);
      localStorage.removeItem(KUYRUK_ANAHTARI);
    } catch (e) {}
  }

  function sahibiDenetle(id) {
    if (!id) return;
    var onceki = null;
    try { onceki = localStorage.getItem(SAHIP_ANAHTARI); } catch (e) {}
    if (onceki === id) return;
    ilerlemeyiSil();
    try { localStorage.setItem(SAHIP_ANAHTARI, id); } catch (e) {}
  }

  /* Denetim sayfanın kendi betiği çalışmadan önce, eşzamanlı yapılır:
     modül sayfası durumu localStorage'dan okuyup hemen çiziyor. */
  (function () {
    var o = yerelOku(OTURUM_ANAHTARI, null);
    sahibiDenetle(o && o.user && o.user.id);
  })();

  function hata(yanit, govde) {
    var m = (govde && (govde.msg || govde.error_description || govde.message || govde.error)) || "";
    var kod = (govde && govde.code) || yanit.status;
    return { kod: kod, mesaj: m || ("Sunucu " + yanit.status + " döndü."), durum: yanit.status };
  }

  /* Türkçeleştirilmiş, kullanıcıya gösterilebilir hata metinleri. */
  function okunurHata(h) {
    var m = (h && h.mesaj || "").toLowerCase();
    if (!ACIK) return "Sunucu ayarlanmamış. config.js dosyasını doldurun.";
    if (h && h.durum === 0) return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
    if (m.indexOf("invalid login") >= 0) return "E-posta veya şifre hatalı.";
    if (m.indexOf("already registered") >= 0 || m.indexOf("already been registered") >= 0)
      return "Bu e-posta ile bir hesap zaten var. Giriş yapmayı deneyin.";
    if (m.indexOf("password") >= 0 && m.indexOf("6") >= 0)
      return "Şifre en az 6 karakter olmalıdır.";
    if (m.indexOf("email") >= 0 && m.indexOf("valid") >= 0)
      return "Geçerli bir e-posta adresi yazın.";
    if (m.indexOf("not confirmed") >= 0)
      return "Hesap henüz doğrulanmamış. E-postanıza gelen bağlantıya tıklayın.";
    if (m.indexOf("rate") >= 0) return "Çok fazla deneme yapıldı. Bir süre bekleyin.";
    return (h && h.mesaj) || "Beklenmeyen bir hata oluştu.";
  }

  function istek(yol, secenek) {
    secenek = secenek || {};
    var basliklar = { "apikey": C.key, "Content-Type": "application/json" };
    if (secenek.basliklar) for (var k in secenek.basliklar) basliklar[k] = secenek.basliklar[k];
    if (oturum && oturum.access_token && !secenek.anonim)
      basliklar["Authorization"] = "Bearer " + oturum.access_token;
    return fetch(C.url.replace(/\/+$/, "") + yol, {
      method: secenek.method || "GET",
      headers: basliklar,
      body: secenek.govde ? JSON.stringify(secenek.govde) : undefined
    }).then(function (y) {
      return y.text().then(function (t) {
        var j = null;
        if (t) { try { j = JSON.parse(t); } catch (e) { j = null; } }
        if (!y.ok) throw hata(y, j);
        return j;
      });
    }, function () {
      throw { kod: "aglar", mesaj: "Sunucuya ulaşılamadı.", durum: 0 };
    });
  }

  /* ---- OAuth dönüşü ------------------------------------------------ */
  /* Supabase, sağlayıcı girişinden sonra jetonları adresin # kısmında
     geri verir. Bunu okuyup adresi temizliyoruz; jeton adres çubuğunda
     ve tarayıcı geçmişinde kalmasın.                                   */
  function hashOturumu() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return null;
    var p = new URLSearchParams(h);
    var hata = p.get("error_description") || p.get("error");
    var tk = p.get("access_token");
    if (!hata && !tk) return null;
    try { history.replaceState(null, "", location.pathname + location.search); }
    catch (e) { location.hash = ""; }
    if (hata) return { hata: hata };
    return {
      access_token: tk,
      refresh_token: p.get("refresh_token"),
      expires_at: Math.floor(Date.now() / 1000) + Number(p.get("expires_in") || 3600)
    };
  }

  /* ---- oturum ------------------------------------------------------ */
  function oturumKaydet(o) {
    if (o && o.access_token) {
      oturum = {
        access_token: o.access_token,
        refresh_token: o.refresh_token,
        expires_at: o.expires_at || (Math.floor(Date.now() / 1000) + (o.expires_in || 3600)),
        user: o.user || (oturum && oturum.user) || null
      };
      yerelYaz(OTURUM_ANAHTARI, oturum);
    }
    return oturum;
  }

  function tazele() {
    if (!oturum || !oturum.refresh_token) return Promise.resolve(null);
    return istek("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", anonim: true, govde: { refresh_token: oturum.refresh_token }
    }).then(oturumKaydet).catch(function () { oturumKapat(); return null; });
  }

  function oturumKapat() {
    oturum = null; profil = null;
    yerelSil(OTURUM_ANAHTARI);
  }

  function kullaniciCek() {
    return istek("/auth/v1/user").then(function (u) {
      if (u && u.id) { oturum.user = { id: u.id, email: u.email };
        yerelYaz(OTURUM_ANAHTARI, oturum); }
      return u;
    });
  }

  function profilOku() {
    if (!oturum) return Promise.resolve(null);
    return istek("/rest/v1/ogrenci?select=id,ad,rol&id=eq." + oturum.user.id)
      .then(function (r) {
        profil = (r && r[0]) || { id: oturum.user.id, ad: "İsimsiz", rol: "ogrenci" };
        return profil;
      })
      .catch(function () {
        profil = { id: oturum.user.id, ad: "İsimsiz", rol: "ogrenci" };
        return profil;
      });
  }

  /* ---- çevrimdışı kuyruk ------------------------------------------- */
  /* Sunucuya yazılamayan her puan burada bekler ve bağlantı gelince
     sırayla gönderilir. Böylece kopan bağlantı cevabı düşürmez.     */
  function kuyrugaEkle(kayit) {
    var k = yerelOku(KUYRUK_ANAHTARI, []);
    k.push(kayit); yerelYaz(KUYRUK_ANAHTARI, k);
  }
  function kuyruguBosalt() {
    if (!ACIK || !oturum) return Promise.resolve();
    var k = yerelOku(KUYRUK_ANAHTARI, []);
    if (!k.length) return Promise.resolve();
    var kalan = [];
    return k.reduce(function (z, kayit) {
      return z.then(function () {
        return gonder(kayit.tablo, kayit.satir).catch(function (h) {
          if (h && (h.durum === 409 || String(h.kod) === "23505")) return;  /* zaten var */
          if (h && h.durum === 0) kalan.push(kayit);                        /* ağ yok */
        });
      });
    }, Promise.resolve()).then(function () {
      if (kalan.length) yerelYaz(KUYRUK_ANAHTARI, kalan); else yerelSil(KUYRUK_ANAHTARI);
    });
  }

  function gonder(tablo, satir) {
    return istek("/rest/v1/" + tablo, {
      method: "POST",
      basliklar: { "Prefer": "resolution=ignore-duplicates,return=minimal" },
      govde: satir
    });
  }

  /* ---- dışa açılan yüzey ------------------------------------------- */
  var FRC = {
    acik: ACIK,

    kullanici: function () {
      if (!oturum) return null;
      return {
        id: oturum.user.id,
        eposta: oturum.user.email,
        ad: (profil && profil.ad) || "İsimsiz",
        rol: (profil && profil.rol) || "ogrenci"
      };
    },

    kayitOl: function (eposta, sifre, ad) {
      if (!ACIK) return Promise.reject({ mesaj: "Sunucu ayarlanmamış." });
      return istek("/auth/v1/signup", {
        method: "POST", anonim: true,
        govde: { email: eposta, password: sifre, data: { ad: ad } }
      }).then(function (r) {
        /* E-posta doğrulaması açıksa oturum gelmez; bunu çağıran ayırt eder. */
        if (r && r.access_token) { oturumKaydet(r); return profilOku().then(function () { return { oturumAcildi: true }; }); }
        return { oturumAcildi: false };
      });
    },

    girisYap: function (eposta, sifre) {
      if (!ACIK) return Promise.reject({ mesaj: "Sunucu ayarlanmamış." });
      return istek("/auth/v1/token?grant_type=password", {
        method: "POST", anonim: true, govde: { email: eposta, password: sifre }
      }).then(function (r) {
        oturumKaydet(r);
        return profilOku().then(kuyruguBosalt).then(function () { return FRC.kullanici(); });
      });
    },

    cikisYap: function () {
      var s = oturum;
      oturumKapat();
      /* Bilgisayar paylaşılıyorsa sıradaki öğrenci temiz başlar. */
      ilerlemeyiSil();
      try { localStorage.removeItem(SAHIP_ANAHTARI); } catch (e) {}
      if (!ACIK || !s) return Promise.resolve();
      return fetch(C.url.replace(/\/+$/, "") + "/auth/v1/logout", {
        method: "POST",
        headers: { "apikey": C.key, "Authorization": "Bearer " + s.access_token }
      }).catch(function () {}).then(function () {});
    },

    /* Oturum yoksa giriş sayfasına gönderir. Sunucu ayarlanmamışsa
       hiçbir şey yapmaz; program yerel kayıtla çalışmayı sürdürür.   */
    korumaliSayfa: function () {
      return FRC.hazir.then(function () {
        if (!ACIK) return true;
        if (oturum) return true;
        var d = encodeURIComponent(location.pathname.split("/").pop() || "moduller.html");
        location.replace((C.girisSayfasi || "giris.html") + "?donus=" + d);
        return false;
      });
    },

    oku: function (modul) {
      if (!ACIK || !oturum) return Promise.resolve(null);
      return Promise.all([
        istek("/rest/v1/tuval?select=puan&modul=eq." + encodeURIComponent(modul)),
        istek("/rest/v1/cevap?select=soru,dogru&modul=eq." + encodeURIComponent(modul))
      ]).then(function (r) {
        var d = { tuval: (r[0] && r[0][0]) ? r[0][0].puan : null, cevaplar: {} };
        (r[1] || []).forEach(function (c) { d.cevaplar[c.soru] = { ok: c.dogru }; });
        return d;
      }).catch(function () { return null; });
    },

    hepsiniOku: function () {
      if (!ACIK || !oturum) return Promise.resolve(null);
      return Promise.all([
        istek("/rest/v1/tuval?select=modul,puan"),
        istek("/rest/v1/cevap?select=modul,soru,dogru")
      ]).then(function (r) {
        var d = {};
        (r[0] || []).forEach(function (t) {
          d[t.modul] = d[t.modul] || { tuval: null, cevaplar: {} };
          d[t.modul].tuval = t.puan;
        });
        (r[1] || []).forEach(function (c) {
          d[c.modul] = d[c.modul] || { tuval: null, cevaplar: {} };
          d[c.modul].cevaplar[c.soru] = { ok: c.dogru };
        });
        return d;
      }).catch(function () { return null; });
    },

    tuvalYaz: function (modul, puan) {
      if (!ACIK || !oturum) return Promise.resolve();
      var satir = { kullanici: oturum.user.id, modul: modul, puan: puan };
      return gonder("tuval", satir).catch(function (h) {
        if (h && h.durum === 0) kuyrugaEkle({ tablo: "tuval", satir: satir });
      });
    },

    cevapYaz: function (modul, soru, dogru) {
      if (!ACIK || !oturum) return Promise.resolve();
      var satir = { kullanici: oturum.user.id, modul: modul, soru: soru, dogru: !!dogru };
      return gonder("cevap", satir).catch(function (h) {
        if (h && h.durum === 0) kuyrugaEkle({ tablo: "cevap", satir: satir });
      });
    },

    /* Sunucuda hangi dış sağlayıcılar açık. Google kapalıysa düğme
       hiç gösterilmez; çalışmayan bir düğme koymamak için.            */
    saglayicilar: function () {
      if (!ACIK) return Promise.resolve({});
      return istek("/auth/v1/settings", { anonim: true })
        .then(function (r) { return (r && r.external) || {}; })
        .catch(function () { return {}; });
    },

    /* Google ile giriş. Sayfa Supabase'e gider, oradan Google'a, sonra
       donusSayfasi adresine jetonlarla döner.                          */
    googleIleGir: function (donusSayfasi) {
      if (!ACIK) return Promise.reject({ mesaj: "Sunucu ayarlanmamış." });
      if (location.protocol === "file:")
        return Promise.reject({ mesaj: "Google ile giriş, dosyayı çift tıklayarak açtığınızda çalışmaz; sitenin bir adreste yayınlanmış olması gerekir." });
      var hedef = new URL(donusSayfasi || "giris.html", location.href).href;
      location.assign(C.url.replace(/\/+$/, "") + "/auth/v1/authorize?provider=google"
        + "&redirect_to=" + encodeURIComponent(hedef));
      return new Promise(function () {});   /* sayfa gidiyor */
    },

    /* ---------------- görevler ve atamalar ----------------
       Antrenör görev oluşturur ve öğrencilere atar. Öğrenci yalnızca
       kendisine atanmış görevleri görür; bunu veritabanı kuralları
       uygular, sayfa değil.                                          */

    /* Antrenör için: bütün görevler, atamalar, teslimler.
       Öğrenci için: kendisine atanmış görevler ve kendi teslimleri.  */
    gorevler: function () {
      if (!ACIK || !oturum) return Promise.resolve(null);
      return Promise.all([
        istek("/rest/v1/gorev?select=*&order=olusturuldu.desc"),
        istek("/rest/v1/atama?select=gorev,ogrenci,atandi"),
        istek("/rest/v1/teslim?select=gorev,ogrenci,aciklama,teslim"),
        istek("/rest/v1/degerlendirme?select=gorev,ogrenci,puan,yorum")
      ]).then(function (r) {
        return { gorev: r[0] || [], atama: r[1] || [],
                 teslim: r[2] || [], degerlendirme: r[3] || [] };
      });
    },

    gorevOlustur: function (g) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      var satir = {
        olusturan: oturum.user.id,
        tur: g.tur || "odev",
        baslik: g.baslik,
        aciklama: g.aciklama || null,
        modul: g.modul || null,
        baglanti: g.baglanti || null,
        son_tarih: g.son_tarih || null
      };
      return istek("/rest/v1/gorev", {
        method: "POST",
        basliklar: { "Prefer": "return=representation" },
        govde: satir
      }).then(function (r) { return (r && r[0]) || null; });
    },

    gorevGuncelle: function (id, alanlar) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/gorev?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        basliklar: { "Prefer": "return=minimal" },
        govde: alanlar
      });
    },

    gorevSil: function (id) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/gorev?id=eq." + encodeURIComponent(id), { method: "DELETE" });
    },

    /* Bir görevi birden çok öğrenciye atar. Zaten atanmış olanlar
       yeniden eklenmeye çalışıldığında veritabanı yoksayar.          */
    ata: function (gorevId, ogrenciler) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      if (!ogrenciler || !ogrenciler.length) return Promise.resolve();
      return istek("/rest/v1/atama", {
        method: "POST",
        basliklar: { "Prefer": "resolution=ignore-duplicates,return=minimal" },
        govde: ogrenciler.map(function (o) { return { gorev: gorevId, ogrenci: o }; })
      });
    },

    atamaKaldir: function (gorevId, ogrenciId) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/atama?gorev=eq." + encodeURIComponent(gorevId)
        + "&ogrenci=eq." + encodeURIComponent(ogrenciId), { method: "DELETE" });
    },

    /* Öğrenci görevi yaptığını bildirir. */
    teslimEt: function (gorevId, aciklama) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/teslim", {
        method: "POST",
        basliklar: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        govde: { gorev: gorevId, ogrenci: oturum.user.id, aciklama: aciklama || null }
      });
    },

    teslimGeriAl: function (gorevId) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/teslim?gorev=eq." + encodeURIComponent(gorevId)
        + "&ogrenci=eq." + encodeURIComponent(oturum.user.id), { method: "DELETE" });
    },

    /* Antrenör bir teslimi puanlar. */
    degerlendir: function (gorevId, ogrenciId, puan, yorum) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/degerlendirme", {
        method: "POST",
        basliklar: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        govde: { gorev: gorevId, ogrenci: ogrenciId,
                 puan: (puan === "" || puan == null) ? null : Number(puan),
                 yorum: yorum || null, yazan: oturum.user.id }
      });
    },

    /* Antrenör bir hesabın rolünü değiştirir. */
    rolDegistir: function (ogrenciId, rol) {
      if (!ACIK || !oturum) return Promise.reject({ mesaj: "Oturum yok." });
      return istek("/rest/v1/ogrenci?id=eq." + encodeURIComponent(ogrenciId), {
        method: "PATCH",
        basliklar: { "Prefer": "return=minimal" },
        govde: { rol: rol }
      });
    },

    ozet: function () {   /* koç tablosu için */
      if (!ACIK || !oturum) return Promise.resolve(null);
      return Promise.all([
        istek("/rest/v1/ogrenci?select=id,ad,rol&order=ad"),
        istek("/rest/v1/tuval?select=kullanici,modul,puan"),
        istek("/rest/v1/cevap?select=kullanici,modul,soru,dogru")
      ]).then(function (r) { return { ogrenciler: r[0] || [], tuval: r[1] || [], cevap: r[2] || [] }; });
    },

    okunurHata: okunurHata
  };

  /* ---- açılış: kayıtlı oturumu çöz -------------------------------- */
  FRC.hazir = (function () {
    if (!ACIK) return Promise.resolve(null);
    var gelen = hashOturumu();
    if (gelen && gelen.hata) { FRC.oauthHatasi = gelen.hata; gelen = null; }
    if (gelen) {
      oturumKaydet(gelen);
      return kullaniciCek()
        .then(function () { sahibiDenetle(oturum && oturum.user && oturum.user.id); })
        .then(profilOku).then(kuyruguBosalt)
        .then(function () { return FRC.kullanici(); })
        .catch(function () { oturumKapat(); return null; });
    }
    oturum = yerelOku(OTURUM_ANAHTARI, null);
    if (!oturum) return Promise.resolve(null);
    var simdi = Math.floor(Date.now() / 1000);
    var p = (oturum.expires_at && oturum.expires_at - 60 <= simdi) ? tazele() : Promise.resolve(oturum);
    return p.then(function (o) {
      if (!o) return null;
      return profilOku().then(kuyruguBosalt).then(function () { return FRC.kullanici(); });
    }).catch(function () { return null; });
  })();

  window.FRC = FRC;
})();
