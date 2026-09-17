# Giriş sistemi kurulumu

Program şu anda giriş olmadan da çalışır; ilerlemeyi yalnızca tarayıcıya kaydeder.
Aşağıdaki dört adım tamamlandığında hesap sistemi devreye girer, ilerleme sunucuda
tutulur ve puanlar tarayıcı üzerinden değiştirilemez hâle gelir.

Tahmini süre: 15 dakika. Ücret yok.

---

## 1. Supabase projesi açın

1. `supabase.com` adresine gidin ve ücretsiz bir hesap açın.
2. **New project** deyin. Bir ad ve bir veritabanı şifresi verin.
   Şifreyi bir yere not edin; bu sizin yönetici şifrenizdir, öğrencilerle paylaşılmaz.
3. Bölge olarak size en yakın olanı seçin.

Proje hazırlanması birkaç dakika sürer.

## 2. Veritabanını kurun

1. Sol menüden **SQL Editor** açın.
2. `schema.sql` dosyasının tamamını kopyalayıp yapıştırın ve **Run** deyin.
3. Hata almadan bittiğini görün.

Bu betik üç tablo kurar ve en önemli kuralı uygular: **puanlar bir kez yazılır,
bir daha değiştirilemez.** Tablolarda UPDATE ve DELETE politikası tanımlanmadığı
için bu işlemler herkese kapalıdır. Kural veritabanında durduğundan, tarayıcı
araçlarıyla oynayarak aşılamaz.

## 3. İki değeri `config.js` dosyasına yazın

Supabase panelinde **Project Settings > API** altında iki değer vardır:

| Panelde adı | `config.js` içinde |
|---|---|
| Project URL | `url` |
| anon public | `key` |

`config.js` dosyasını açıp bu ikisini tırnakların arasına yapıştırın:

```js
window.FRC_CONFIG = {
  url:  "https://xxxxxxxxxxxx.supabase.co",
  key:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  girisSayfasi: "giris.html"
};
```

`anon` anahtarı gizli değildir; tarayıcıda görünmek üzere tasarlanmıştır.
Asıl koruma 2. adımdaki satır düzeyinde güvenlik kurallarıdır. **service_role**
anahtarını buraya asla yazmayın; o anahtar bütün kuralları atlar.

## 4. Kendinizi antrenör yapın

1. `giris.html` sayfasını açıp kendinize bir hesap açın.
2. Supabase panelinde **Authentication > Users** altında hesabınızın `id` değerini
   kopyalayın.
3. **SQL Editor** açıp şunu çalıştırın:

```sql
update public.ogrenci set rol = 'koc' where id = 'BURAYA_ID';
```

Artık `koc.html` size bütün öğrencilerin modül modül puanlarını, `admin.html` ise
görev oluşturma ve atama panelini açar. Bundan sonraki antrenörleri SQL'e
dokunmadan panelin Öğrenciler sekmesinden işaretleyebilirsiniz.

## 5. Google ile giriş (isteğe bağlı)

Bu adım yapılmazsa giriş sayfasında Google düğmesi hiç görünmez; e-posta ile
giriş çalışmaya devam eder. Düğme, sunucuda sağlayıcının açık olup olmadığına
bakılarak gösterilir.

**Önce bilinmesi gereken iki şey.** Google ile giriş, dosyayı çift tıklayarak
açtığınızda çalışmaz; sitenin bir adreste yayınlanmış olması gerekir, çünkü
Google yalnızca kayıtlı bir adrese geri dönebilir. İkincisi, bu adım Google
tarafında bir proje açmayı gerektirir.

### Google tarafı

1. `console.cloud.google.com` adresinde bir proje açın.
2. **APIs & Services > OAuth consent screen** bölümünü doldurun. Uygulama adını
   ve destek e-postasını yazmanız yeterlidir. Yalnızca kendi okulunuzun hesapları
   girecekse *Internal*, herkes girecekse *External* seçin.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID** deyin.
   Tür olarak **Web application** seçin.
4. **Authorized redirect URIs** alanına Supabase'in geri dönüş adresini yazın:

   ```
   https://<proje-kodu>.supabase.co/auth/v1/callback
   ```

   `<proje-kodu>` yerine `config.js` içindeki adresin başındaki kodu yazın.
5. Oluşturunca verilen **Client ID** ve **Client secret** değerlerini kopyalayın.

### Supabase tarafı

6. Supabase panelinde **Authentication > Providers > Google** bölümünü açın.
   Sağlayıcıyı etkinleştirip Client ID ve Client secret değerlerini yapıştırın,
   kaydedin.
7. **Authentication > URL Configuration** bölümünde:
   - **Site URL** alanına sitenizin adresini yazın.
   - **Redirect URLs** listesine giriş sayfanızın adresini ekleyin, örneğin
     `https://kullanici.github.io/frc-calisma-programi/giris.html`. Alt
     sayfaların hepsini kapsaması için
     `https://kullanici.github.io/frc-calisma-programi/**` biçiminde bir satır
     da yazabilirsiniz.

Bu liste eksikse Google girişi "redirect_to is not allowed" benzeri bir hatayla
döner ve giriş sayfası hatayı olduğu gibi gösterir.

Panel bölüm adları zaman zaman değişebilir; ekranda gördüğünüz etiketleri esas
alın.

### Adın nereden geldiği

E-posta ile kayıtta öğrenci adını kendisi yazar. Google ile girişte ad Google
profilinden alınır; `schema.sql` içindeki tetikleyici sırayla `ad`, `full_name`
ve `name` alanlarına, hiçbiri yoksa e-postanın @ işaretinden önceki kısmına
bakar. Bu yüzden 2. adımdaki betiğin güncel sürümünü çalıştırdığınızdan emin
olun; eski sürüm Google kullanıcılarını "İsimsiz" olarak kaydeder.

---

## E-posta doğrulaması

Supabase varsayılan olarak yeni hesaplara doğrulama e-postası gönderir. Takım için
bunu kapatmak isterseniz: **Authentication > Providers > Email** altında
*Confirm email* seçeneğini kapatın. Kapalıyken öğrenci hesabı açar açmaz girebilir.

Açık bırakırsanız, ücretsiz planın günlük e-posta sınırı düşüktür; kalabalık bir
takımda hepsini aynı gün kaydetmeyin veya kendi SMTP bilgilerinizi tanımlayın.

## Site herkese açıkken yeni kayıtlar

Site herkese açık bir adreste yayındaysa, giriş sayfasını bulan herkes hesap
açabilir. Takım listenizin yabancı kayıtlarla dolmaması için Supabase panelinde
**Authentication** bölümündeki kullanıcı kayıt ayarlarına gidip yeni kayıtlara
izin veren seçeneği kapatın. Kapalıyken hesapları siz açarsınız:
**Authentication > Users > Add user**.

Öğrencinin kendi hesabını açmasını istiyorsanız kayıt açık kalabilir; o zaman
zaman zaman listeyi gözden geçirip tanımadığınız hesapları silmeniz gerekir.

Panel bölüm adları değişebilir; aradığınız şey "yeni kullanıcıların kayıt
olmasına izin ver" anlamına gelen seçenektir.

## Dosyaları nereye koymalı

Bütün dosyalar aynı klasörde durmalıdır. Klasörü olduğu gibi bir statik barındırma
hizmetine yükleyebilirsiniz; Cloudflare Pages ve GitHub Pages ücretsiz planlarıyla
yeterlidir. Barındırıldığında program telefondan da açılır ve her bilgisayara dosya
kopyalamak gerekmez.

Yükledikten sonra Supabase panelinde **Authentication > URL Configuration** altına
sitenizin adresini ekleyin.

## Ne kadar koruyor, ne kadar korumuyor

Koruduğu: bir öğrenci kendi puanını değiştiremez, silemez, başkasının kaydını
göremez. Aldığı ilk puan kalıcıdır ve bir sonraki modül ancak ortalama %70'i
geçince açılır.

Korumadığı: statik barındırmada modül sayfalarının içeriği, adresi bilen herkese
açıktır. Amaç sırayı zorlamak olduğu için bu bir sorun değildir; içeriğin de gizli
olması gerekiyorsa sayfaları giriş kontrolünden geçirerek sunan ayrı bir katman
gerekir.

## Sunucu ayarlanmadan önce

`config.js` boş bırakıldığı sürece giriş sayfası bunu açıkça söyler, program
çalışmaya devam eder ve ilerlemeyi tarayıcıya kaydeder. Bağlantı kurulduktan sonra
kesilirse cevaplar yerel bir kuyrukta bekler ve bağlantı gelince sunucuya yazılır.
