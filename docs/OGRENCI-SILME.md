# Hesap silme

Yönetim panelindeki öğrenci listesinde her satırın sağında bir **Sil** düğmesi
vardır. Düğme yalnızca admin rolündeki hesaplarda görünür; admin hesapları ve
kişinin kendi satırı için hiç çıkmaz.

Düğmeye basınca satırın altında bir onay kutusu açılır. Silme ancak oradaki
**Evet, hesabı sil** düğmesine basılınca yapılır ve geri alınamaz: hesap,
tuval ve test puanları, görev atamaları, teslimler, değerlendirmeler ve giriş
kayıtları birlikte gider. Silinen e-posta adresiyle yeniden hesap açılabilir.

## Neden ayrı bir sunucu işlevi gerekiyor

Bir hesabı `auth.users` tablosundan silmek, Supabase'in yalnızca gizli
anahtarla (service role) çalışan yönetici ucunu gerektirir. O anahtar tarayıcıya
indirilemez; indirilseydi siteyi açan herkes veritabanının tamamına erişirdi.
Bu yüzden silme işi `ogrenci-sil` adlı bir Edge Function'a verilmiştir:
anahtar orada durur, tarayıcıya hiç inmez.

Yetki denetimi de orada yapılır. Sayfadaki düğmeyi kaldırmak veya tarayıcı
konsolundan istek atmak denetimi aşmaz; işlev her istekte şunlara bakar:

- İsteği gönderen oturum geçerli mi,
- Gönderen `admin` rolünde mi,
- Hedef kendisi değil mi,
- Hedef `admin` rolünde değil mi.

Dördünden biri sağlanmazsa istek reddedilir.

## Kurulum (bir kez yapılır)

Kodun kendisi depoda: `supabase/functions/ogrenci-sil/index.ts`.
İçinde hiçbir anahtar yazmaz; anahtarı Supabase ortamdan verir.

1. Supabase panelinde projeyi açın, sol menüden **Edge Functions**.
2. **Deploy a new function** → **Via Editor**.
3. İşlevin adını tam olarak `ogrenci-sil` yapın. Ad farklı olursa sayfa
   işlevi bulamaz.
4. Şablonu silip `supabase/functions/ogrenci-sil/index.ts` dosyasının
   tamamını yapıştırın.
5. **Deploy function**.

Ayrıca gizli anahtar tanımlamanız gerekmez: Supabase, Edge Function'lara
`SUPABASE_URL` ve `SUPABASE_SECRET_KEYS` (eski projelerde
`SUPABASE_SERVICE_ROLE_KEY`) değişkenlerini kendiliğinden verir. Kod ikisini
de tanır.

## Alan adı değişirse

İşlev yalnızca tanıdığı adreslerden gelen isteklere cevap verir. Liste
dosyanın başındaki `IZINLI_KOKENLER` dizisindedir:

```
https://rookiepit.com
https://www.rookiepit.com
https://semihkose11.github.io
```

Siteye yeni bir adres eklenirse bu diziye de eklenmeli ve işlev yeniden
deploy edilmelidir.

## Silinenler

`ogrenci`, `tuval`, `cevap`, `atama`, `teslim`, `degerlendirme` ve
`giris_kaydi` tablolarındaki satırlar şemadaki `on delete cascade` kuralıyla
kendiliğinden gider; işlevin ayrıca bir şey silmesi gerekmez. Kişinin
oluşturduğu görevler de (`gorev.olusturan`) aynı kuralla silinir; bir mentörü
silmeden önce oluşturduğu görevlerin gitmesini istemiyorsanız görevleri başka
bir hesapla yeniden oluşturun.
