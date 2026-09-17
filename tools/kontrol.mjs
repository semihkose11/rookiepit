/* Depo bütünlük kontrolü. Bağımlılık gerektirmez: node tools/kontrol.mjs
   Modül kaynaklarını, sayfa dosyalarını ve ana ekranın bağlantılarını denetler. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
const hatalar = [];
const uyar = (m) => hatalar.push(m);

const bolumler = ["electrical", "programming", "cad"];
const modulIdleri = new Set();
let moduller = [];

for (const b of bolumler) {
  const dizin = join(KOK, "modules", b);
  for (const ad of readdirSync(dizin).filter((f) => f.endsWith(".json"))) {
    const yol = join(dizin, ad);
    let d;
    try { d = JSON.parse(readFileSync(yol, "utf8")); }
    catch (e) { uyar(`${b}/${ad}: JSON okunamadı — ${e.message}`); continue; }
    moduller.push({ b, ad, yol, d });
    modulIdleri.add(d.id);
  }
}

for (const { b, ad, d } of moduller) {
  const e = (m) => uyar(`${b}/${ad}: ${m}`);
  if (d.department !== b) e(`department "${d.department}", klasör "${b}"`);
  if (!d.title || !d.summary) e("title veya summary boş");
  if (!Number.isInteger(d.estimatedMinutes)) e("estimatedMinutes tam sayı değil");

  const soruIdleri = new Set();
  for (const s of d.drills ?? []) {
    if (soruIdleri.has(s.id)) e(`yinelenen soru id: ${s.id}`);
    soruIdleri.add(s.id);
    if (!/^https?:\/\//.test(s.source ?? "")) e(`${s.id}: source adresi yok`);
    if (!s.explanation || s.explanation.split(/\s+/).length < 30)
      e(`${s.id}: açıklama çok kısa`);
  }
  if (!soruIdleri.size) e("hiç soru yok");

  if ((d.cards ?? []).length !== 3) e(`kart sayısı ${d.cards?.length ?? 0}, 3 olmalı`);
  const merdiven = ["behaviour", "mechanism", "pit"];
  (d.cards ?? []).forEach((k, i) => {
    if (k.rung !== merdiven[i]) e(`${k.id}: rung "${k.rung}", "${merdiven[i]}" bekleniyordu`);
    for (const kaynak of k.derivedFrom ?? [])
      if (!soruIdleri.has(kaynak)) e(`${k.id}: derivedFrom "${kaynak}" bu modülde yok`);
    for (const alan of ["front", "back", "takeaway"])
      if (/\b[RIGE]\d{3}\b/.test(k[alan] ?? "")) e(`${k.id}.${alan}: kural numarası geçiyor`);
  });

  for (const on of d.prerequisites ?? [])
    if (!modulIdleri.has(on)) e(`prerequisite "${on}" diye bir modül yok`);
}

/* Ana ekranın bağlandığı dosyalar ve modül anahtarlarının benzersizliği */
const indeks = readFileSync(join(KOK, "moduller.html"), "utf8");
const satirlar = JSON.parse(indeks.match(/const ROWS=(\[.*?\]), LAB=/s)[1]);
if (satirlar.length !== moduller.length)
  uyar(`moduller.html ${satirlar.length} modül sayıyor, modules/ ${moduller.length} taşıyor`);

const anahtarlar = new Map();
for (const r of satirlar) {
  if (!existsSync(join(KOK, r.file))) uyar(`moduller.html: "${r.file}" dosyası yok`);
  else {
    const sayfa = readFileSync(join(KOK, r.file), "utf8");
    const m = sayfa.match(/const SKEY="([^"]+)"/);
    if (!m) uyar(`${r.file}: SKEY bulunamadı`);
    else if (m[1] !== r.key) uyar(`${r.file}: SKEY "${m[1]}", moduller.html "${r.key}" diyor`);
    if (!sayfa.includes("Semih Tuna Köse")) uyar(`${r.file}: telif satırı yok`);
  }
  if (anahtarlar.has(r.key)) uyar(`"${r.key}" anahtarı iki modülde: ${anahtarlar.get(r.key)} ve ${r.id}`);
  anahtarlar.set(r.key, r.id);
  if (!modulIdleri.has(r.id)) uyar(`moduller.html: "${r.id}" modules/ altında yok`);
}

/* Karşılama sayfası: bağlantılar ve duyurulan sayılar */
const ana = readFileSync(join(KOK, "index.html"), "utf8");
for (const hedef of ["moduller.html", "giris.html"])
  if (!ana.includes(hedef)) uyar(`index.html "${hedef}" sayfasına bağlanmıyor`);
const soruToplam = moduller.reduce((t, { d }) => t + (d.drills?.length ?? 0), 0);
const kartToplam = moduller.reduce((t, { d }) => t + (d.cards?.length ?? 0), 0);
const dkToplam = moduller.reduce((t, { d }) => t + (d.estimatedMinutes ?? 0), 0);
const duyuru = [
  [String(moduller.length), "modül"],
  [String(soruToplam), "soru"],
  [String(kartToplam), "kart"],
  [String(Math.round(dkToplam / 60)), "saat"],
];
for (const [sayi, ad] of duyuru) {
  const kalip = new RegExp(`<b>${sayi}</b>\\s*${ad}|${ad}\\s*<b>${sayi}</b>`);
  if (!kalip.test(ana)) uyar(`index.html ${sayi} ${ad} duyurmuyor — gerçek değer bu`);
}

/* Yönetim paneli ile öğrenci görünümü aynı modül listesini kullanmalı */
const yonetim = readFileSync(join(KOK, "admin.html"), "utf8");
const panelMods = JSON.parse(yonetim.match(/var MODS=(\[.*?\]);/s)[1]);
if (panelMods.length !== moduller.length)
  uyar(`admin.html ${panelMods.length} modül seçeneği sunuyor, modules/ ${moduller.length} taşıyor`);
for (const m of panelMods)
  if (!modulIdleri.has(m.id)) uyar(`admin.html: "${m.id}" diye bir modül yok`);

/* Görev altyapısı: şema, katman ve sayfalar birbirini tutuyor mu */
const sema = readFileSync(join(KOK, "schema.sql"), "utf8");
for (const tablo of ["gorev", "atama", "teslim", "degerlendirme"]) {
  if (!new RegExp(`create table if not exists public\\.${tablo}\\b`).test(sema))
    uyar(`schema.sql "${tablo}" tablosunu kurmuyor`);
  if (!new RegExp(`alter table public\\.${tablo}\\s+enable row level security`).test(sema))
    uyar(`schema.sql "${tablo}" tablosunda satır güvenliği açık değil`);
}
const katman = readFileSync(join(KOK, "sync.js"), "utf8");
for (const islev of ["gorevler", "gorevOlustur", "gorevGuncelle", "gorevSil",
                     "ata", "atamaKaldir", "teslimEt", "degerlendir", "rolDegistir"])
  if (!new RegExp(`\\b${islev}:\\s*function`).test(katman))
    uyar(`sync.js "${islev}" işlevini sunmuyor`);

/* FRC katmanına başvuran her sayfa, katman yüklenmemiş olabileceğini
   hesaba katmalı. Aksi hâlde sayfa tek başına açıldığında sessizce çöker. */
for (const sayfa of ["index.html", "moduller.html", "giris.html", "koc.html", "admin.html"]) {
  const icerik = readFileSync(join(KOK, sayfa), "utf8");
  if (!/\bFRC\b/.test(icerik)) continue;
  for (const dosya of ["config.js", "sync.js"])
    if (!icerik.includes(`src="${dosya}"`)) uyar(`${sayfa} "${dosya}" dosyasını yüklemiyor`);
  if (!/if\s*\(\s*!?\s*window\.FRC\b/.test(icerik))
    uyar(`${sayfa} FRC katmanının yüklenip yüklenmediğini denetlemiyor`);
}

/* Gizli anahtar sızıntısı */
const ayar = readFileSync(join(KOK, "config.js"), "utf8");
if (/service_role/i.test(ayar)) uyar("config.js içinde service_role anahtarı var — bu asla depoya girmemeli");

console.log(`${moduller.length} modül, ${satirlar.length} sayfa denetlendi.`);
if (hatalar.length) {
  console.log(`\n${hatalar.length} sorun:`);
  for (const h of hatalar) console.log("  · " + h);
  process.exit(1);
}
console.log("Sorun bulunmadı.");
