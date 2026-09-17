# Bilinen sorunlar

Bu liste, içeriği hazırlarken görülüp **bilerek düzeltilmeyen** maddeleri tutar.
Toplu düzenleme sırasında sessizce yapılan düzeltmeler hataların kaynağıdır;
bu yüzden görülen her sorun değiştirilmek yerine buraya yazıldı. Her madde ayrı
ayrı değerlendirilmeyi bekliyor.

## Kaynaklardaki çelişkiler

**BUMPER ZONE ölçüleri — `cad-11-robot-rules`**
Kural metni 2.5in (6.35cm) – 5.75in (14.61cm) veriyor, aynı sezonun Rev. 0 denetim
listesi 2.75in (6.98cm) – 5.5in (13.98cm) yazıyor. Çelişki FIRST'ün kendi
belgelerinde. Modül kuralın geçerli olduğuna karar verdi; sayfa yalnızca kuralın
aralığını gösteriyor, daraltılmış aralığı hiç yazmıyor.

**`cad-12-d2` kural göndermeleri**
`ruleRefs` alanı kendi alıntısıyla tam örtüşmüyor: R107 "toplam yükseklik 30.0in"
diye özetlenmiş, ama alıntı onu "Extensions" maddesinin içine koyuyor. R104
`ruleRefs`'te var, alıntıda yok. Sayfaya hiçbir kural numarası veya inç değeri
taşınmadı, dolayısıyla hata yayılmadı.

## Soru metinlerindeki kusurlar

**`cad-05-d4` — sıra sayıları şıklarla uyuşmuyor**
Doğru cevap ikinci şık olduğu hâlde açıklama "üçüncü aday" diyor; boşluklu aday
üçüncü şık olduğu hâlde "ikinci aday" deniyor. Sayfada hiç sıra sayısı
kullanılmadı, adayların kendi adları yazıldı.

**`cad-03-d5` — bozuk karakter**
Açıklamadaki `i̇kinci` kelimesi `U+0069` + `U+0307 COMBINING DOT ABOVE` dizisi;
"i" harfinin üzerinde fazladan bir nokta var. Türkçe büyük/küçük harf
dönüşümünden kalma bir artık. Modülün başka hiçbir alanında yok.

**`cad-10-d6` — alan sırası ve meta cümle**
Alan sırası diğer yedi drill'in tersi (`options`/`correctIndex` önce, `prompt`
sonra). Ayrıca doğru şıkkı "Kaynak ... yazar" biçiminde bir meta cümle; bu,
"kaynağa atıf yapan şık doğrudur" kestirmesine yol açabilir.

**`cad-11-d4` — biçim tutarsızlığı**
`elements[2]` "115.0lb" yazarken açıklaması "115lbs (52.16kg)" yazıyor. Olgu
hatası değil, yazım farkı.

**`electrical-09-d1` — yinelenen kural göndermesi**
`ruleRefs` alanında R614 iki kez listeleniyor.

## Yapısal farklar

**`electrical-00` kurulum tuvali taşımıyor.** 39 modülün 38'inde tuval var,
`electrical-00-tools` sayfasında yok. Ana ekran bunu dosyadan okuyup o modülde
geçme ölçütünü yalnızca test puanına çeviriyor; aksi hâlde modül hiçbir zaman
geçilemez ve bütün elektrik bölümü kilitli kalırdı. Kalıcı çözüm o modüle de
bir tuval eklemektir.

**`electrical-01` dokuz soru taşıyor**, diğer bütün modüller sekiz. Ana ekran ve
geçme hesabı modülün kendi soru sayısını kullandığı için bu bir sorun çıkarmıyor,
ama modüller arasında eşitsizlik yaratıyor.

**Kavram gövdesi paragraf sayısı değişiyor.** `cad-03`, `cad-04`, `cad-05` ve
`cad-10` üç paragraf, `cad-07` altı paragraf, diğerleri dört. Sayfa iskeleti tam
dört kavram figürü istediği için üç paragraflık modüllerde bir paragrafa iki
figür bağlandı.

**Gövdede tanımlanmayan terimler.** `cad-08`'de restore işaretlerinin anlamları,
`cad-09` ve `cad-10`'da `revision`, `cad-10`'da `Reference manager` ve
`Selective update`, `cad-12`'de `degrees of freedom` yalnızca soru
açıklamalarında geçiyor, `concept.body`'de tanımlı değil.

## Doğrulama kayıtları

**`verifiedOn` tarihleri toplu atanmış.** 39 modülün 30'u `2026-09-02`, altısı
`2026-09-01` taşıyor. Bunlar gerçek tek tek doğrulama tarihleri değil, toplu
yazılmış değerlerdir. Bir modülün kaynağı yeniden kontrol edildiğinde o modülün
tarihi tek başına güncellenmelidir.

## Eksik kalanlar

**İngilizce sürüm tamamlanmadı.** 39 modülün yalnızca bir bölümü çevrildi ve
çevrilenler eski şema sürümünde kaldı. Bu yüzden depoya alınmadı. İngilizce
manifest ve sözlük de üretilmedi.

**Şık uzunlukları dengesiz.** Bazı sorularda doğru şık diğerlerinden belirgin
biçimde uzun. Uzun şıkkı seçme eğilimi bilinen bir sınav alışkanlığıdır, ancak
bu maddenin düzeltilmesi istenmedi.
