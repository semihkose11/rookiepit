# Sayfaların nasıl üretildiği

Bu depo üretilmiş sayfaları ve onların kaynaklarını taşır; üretim betikleri
depoda değildir. Bir modülü elle değiştirmek isterseniz iki yol vardır.

## Küçük bir düzeltme

Modül sayfası tek bir HTML dosyasıdır. İçindeki `const D = {...}` bloğu o
modülün bütün metnini taşır. Bir yazım hatasını doğrudan orada düzeltebilirsiniz;
aynı düzeltmeyi `modules/<bölüm>/<modül>.json` dosyasına da yapın, yoksa ikisi
birbirinden ayrılır.

## Bir soruyu veya kartı değiştirmek

Kaynak `modules/` altındaki JSON dosyasıdır. Şu alanlar bir modülü tanımlar:

| alan | ne işe yarar |
|---|---|
| `concept.body` | kavram anlatımı, paragraflara bölünmüş |
| `concept.keyTerms` | terim ve karşılığı; sayfadaki referans şeridi |
| `cards` | üç kart: `behaviour` → `mechanism` → `pit` |
| `cards[].derivedFrom` | kartın dayandığı iki sorunun id'si |
| `drills` | sorular; her birinde `prompt`, şıklar, `explanation`, `source` |
| `drills[].source` | o sorunun dayandığı birincil kaynağın adresi |
| `prerequisites` | önce geçilmesi gereken modüllerin id'si |
| `estimatedMinutes` | ana ekranda görünen süre |

`source` alanı boş bırakılmamalıdır. Bu programın tek bağlayıcı kuralı, her
sorunun doğrulanabilir bir kaynağa bağlı olmasıdır.

## Ana ekranın modülleri nereden bildiği

`moduller.html` içinde `const ROWS=[...]` dizisi modül listesini taşır: bölüm,
numara, dosya adı, başlık, özet, süre ve soru id'leri. Yeni bir modül eklerken
bu diziye bir satır eklemek ve sayfayı aynı klasöre koymak yeterlidir.

Karşılama sayfası `index.html` ayrı ve elle yazılmıştır; modül listesi
üretilmiş bir dosyadır.

Sıralı kilit bu dizinin sırasını kullanır: bir bölümdeki modüller yazıldıkları
sırayla açılır.

## Geçme ölçütü

`moduller.html` içinde `PASS=70` sabiti eşiği belirler. Ölçüt, kurulum tuvalindeki
ilk puan ile testteki ilk puanın ortalamasıdır. İlk puanların kalıcılığı iki
yerde uygulanır: tarayıcı kaydında `state.__b` bir kez yazılır, hesap sistemi
açıksa veritabanı ikinci yazmayı reddeder.

## Giriş katmanı

`sync.js` Supabase'in REST ve auth uçlarına düz `fetch` ile bağlanır; dış
kütüphane yüklemez. Dışa açtığı işlevler:

| işlev | ne yapar |
|---|---|
| `FRC.hazir` | kayıtlı oturumu veya sağlayıcı dönüşünü çözer |
| `FRC.kayitOl` / `FRC.girisYap` | e-posta ile hesap açma ve giriş |
| `FRC.saglayicilar()` | sunucuda hangi dış sağlayıcılar açık |
| `FRC.googleIleGir(donus)` | Google akışını başlatır |
| `FRC.korumaliSayfa()` | oturum yoksa giriş sayfasına gönderir |
| `FRC.oku` / `FRC.hepsiniOku` | ilerlemeyi sunucudan okur |
| `FRC.tuvalYaz` / `FRC.cevapYaz` | ilk puanı sunucuya yazar |
| `FRC.ozet()` | antrenör tablosunun verisi |

Sağlayıcı dönüşünde Supabase jetonları adresin `#` kısmında verir. `sync.js`
bunu okuyup oturumu kaydeder ve adresi temizler, böylece jeton adres çubuğunda
ve tarayıcı geçmişinde kalmaz. Dönüş sırasında hata gelirse `FRC.oauthHatasi`
alanına yazılır ve giriş sayfası bunu gösterir.

Google düğmesi `FRC.saglayicilar()` sonucuna göre gösterilir; sağlayıcı kapalıysa
düğme hiç çizilmez.

## Görev altyapısı

Dört tablo birbirine bağlıdır:

```
gorev          antrenörün yazdığı tanım: tür, başlık, açıklama, modül,
               bağlantı, son tarih, kapalı mı
atama          hangi görev hangi öğrenciye verildi
teslim         öğrenci "yaptım" dedi; isterse bir açıklama bırakır
degerlendirme  antrenörün verdiği puan ve yorum
```

`gorev.tur` dört değerden birini alır: `odev`, `modul`, `okuma`, `serbest`.
`modul` türünde `gorev.modul` alanı bir modül id'si taşır ve öğrenciye o
modülün bağlantısı gösterilir.

Kimin neyi görebileceği veritabanında tanımlıdır. Bir öğrenci yalnızca
kendisine atanmış görevleri okuyabilir; `gorev` tablosunun okuma politikası
`atama` tablosuna bakarak karar verir. Öğrenci teslim yazabilir ama yalnızca
kendisine atanmış bir görev için. Puanı yalnızca antrenör yazar.

Yeni bir görev türü eklemek için üç yeri değiştirmek gerekir: `schema.sql`
içindeki `check (tur in (...))` kısıtı, `admin.html` içindeki `TURAD` ve tür
seçim listesi, `moduller.html` içindeki `TURAD`.

Antrenör bir hesabı `admin.html` içindeki Öğrenciler sekmesinden antrenör
yapabilir. İlk antrenör hesabı bu yolla yapılamaz; onu bir kez SQL ile
işaretlemek gerekir (bkz. `docs/KURULUM.md`, 4. adım).
