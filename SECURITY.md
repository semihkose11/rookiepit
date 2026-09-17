# Güvenlik

## Depoda duran anahtar

`config.js` dosyasında bir Supabase adresi ve `anon` anahtarı bulunur. **Bu bir
sızıntı değildir.** `anon` anahtarı tarayıcıda görünmek üzere tasarlanmıştır ve
tek başına hiçbir veriye erişim vermez. Erişimi belirleyen şey `schema.sql`
içindeki satır düzeyinde güvenlik kurallarıdır: bir öğrenci yalnızca kendi
kaydını okuyabilir, puanını değiştiremez, başkasının kaydını göremez.

Depoda **asla** bulunmaması gereken anahtar `service_role` anahtarıdır; o bütün
kuralları atlar. `tools/kontrol.mjs` her çalıştığında `config.js` içinde böyle
bir anahtar olup olmadığını denetler.

## Bir zafiyet bulduysanız

Aşağıdakiler gibi bir şey bulursanız, herkese açık bir issue açmak yerine depo
sahibine özel olarak bildirin:

- bir öğrencinin başka bir öğrencinin kaydını okuyabilmesi
- bir öğrencinin kendi puanını değiştirebilmesi veya silebilmesi
- öğrenci hesabının antrenör yetkilerine erişebilmesi
- `service_role` anahtarının herhangi bir yerde açıkta durması

Bunlar satır düzeyinde güvenlik kurallarının amacına aykırıdır ve düzeltilmesi
gerekir.

## Neyin güvenlik sorunu olmadığı

**Modül içeriğinin herkese açık olması.** Depo public ise sayfalar adresi bilen
herkese açıktır. Programın amacı içeriği gizlemek değil, öğrencinin sırayı
atlamasını engellemektir; o kilit sunucuda tutulur.

**Girişsiz kullanımda ilerlemenin tarayıcıda tutulması.** `config.js` boş
bırakıldığında ilerleme yalnızca tarayıcıya kaydedilir ve tarayıcı araçlarıyla
değiştirilebilir. Bu bilinen bir sınırdır, hesap sistemi tam olarak bunu
çözmek için vardır.
