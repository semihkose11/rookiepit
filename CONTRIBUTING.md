# Katkı ve hata bildirimi

Bu depo açık bir lisansla dağıtılmıyor ([LICENSE](LICENSE)), bu yüzden pull
request kabul edilmiyor. Gönderilen bir PR birleştirilemez; emeğinizin boşa
gitmemesi için baştan söylüyorum.

Buna karşılık **hata bildirimleri gerçekten işe yarar** ve memnuniyetle
karşılanır. Bu programın tek bağlayıcı kuralı, her sorunun doğrulanabilir bir
kaynağa dayanması. Bir yerde hata varsa öğrenciye yanlış bilgi gidiyor demektir.

## Olgu hatası bildirmek

Issue açarken şu üçünü yazın:

1. **Hangi modül ve hangi soru.** Örnek: `cad-05-variables-configurations`,
   soru `cad-05-d4`. Soru id'leri `modules/` altındaki JSON dosyalarında ve
   sayfanın kendisinde görünür.
2. **Ne yazıyor, ne yazması gerekirdi.**
3. **Kaynak adresi.** Hangi resmî belge sizin dediğinizi söylüyor. Kaynak
   olmadan bir düzeltme yapılmıyor; bu kural içeriğin tamamı için geçerli.

Bir çelişki bulduysanız ve iki kaynak birbirini tutmuyorsa, ikisinin adresini de
yazın. Böyle durumlar gizlenmiyor, [docs/BILINEN-SORUNLAR.md](docs/BILINEN-SORUNLAR.md)
dosyasına kaydediliyor.

## Zaten bilinen sorunlar

Bildirmeden önce [docs/BILINEN-SORUNLAR.md](docs/BILINEN-SORUNLAR.md) dosyasına
bakın. Görülüp bilerek düzeltilmeyen maddeler orada listeli; aynı şeyi ikinci kez
bildirmenize gerek yok.

## Arayüz veya çalışma hatası

Sayfa açılmıyor, bir düğme çalışmıyor, puan yanlış hesaplanıyorsa şunları yazın:
hangi sayfa, hangi tarayıcı, ne yaptınız, ne olmasını beklediniz, ne oldu.
Tarayıcı konsolunda bir hata varsa metnini ekleyin.

Bildirmeden önce `node tools/kontrol.mjs` çalıştırırsanız, sorunun depo
bütünlüğüyle ilgili olup olmadığını kendiniz görebilirsiniz.
