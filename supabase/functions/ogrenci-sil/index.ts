// ---------------------------------------------------------------------
//  ogrenci-sil · Supabase Edge Function
//
//  Bir hesabı auth.users tablosundan kalıcı olarak siler. ogrenci, tuval,
//  cevap, atama, teslim, degerlendirme ve giris_kaydi tablolarındaki
//  satırlar şemadaki "on delete cascade" kuralıyla kendiliğinden gider.
//
//  Silme yetkisi yalnızca admin rolündedir ve bu kural burada, sunucuda
//  denetlenir; sayfadaki düğmeyi kaldırmak veya tarayıcıdan istek atmak
//  denetimi aşmaz.
//
//  Gizli anahtar bu dosyada yazmaz. Supabase, Edge Function'lara
//  SUPABASE_SECRET_KEYS (veya eski adıyla SUPABASE_SERVICE_ROLE_KEY)
//  değişkenini kendiliğinden verir; kod onu ortamdan okur.
// ---------------------------------------------------------------------

const IZINLI_KOKENLER = [
  "https://rookiepit.com",
  "https://www.rookiepit.com",
  "https://semihkose11.github.io",
];

function cors(koken: string | null): Record<string, string> {
  const k = koken && IZINLI_KOKENLER.indexOf(koken) >= 0 ? koken : IZINLI_KOKENLER[0];
  return {
    "Access-Control-Allow-Origin": k,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function gizliAnahtar(): string {
  const eski = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (eski) return eski;
  const yeni = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (yeni) {
    try {
      const o = JSON.parse(yeni);
      if (o && typeof o["default"] === "string") return o["default"];
    } catch (_e) { /* biçim beklenenden farklıysa aşağıda hata verilir */ }
  }
  throw new Error("Gizli anahtar ortamda bulunamadı.");
}

function yanit(govde: unknown, durum: number, koken: string | null): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...cors(koken), "Content-Type": "application/json" },
  });
}

Deno.serve(async (istek: Request) => {
  const koken = istek.headers.get("origin");

  if (istek.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(koken) });
  }
  if (istek.method !== "POST") {
    return yanit({ mesaj: "Yalnızca POST kabul edilir." }, 405, koken);
  }

  const url = Deno.env.get("SUPABASE_URL");
  if (!url) return yanit({ mesaj: "Sunucu yapılandırması eksik." }, 500, koken);

  let anahtar: string;
  try { anahtar = gizliAnahtar(); }
  catch (_e) { return yanit({ mesaj: "Sunucu yapılandırması eksik." }, 500, koken); }

  const yetki = istek.headers.get("Authorization") || "";
  if (!yetki.startsWith("Bearer ")) {
    return yanit({ mesaj: "Oturum bulunamadı." }, 401, koken);
  }

  let hedef = "";
  try {
    const g = await istek.json();
    hedef = String((g && g.id) || "").trim();
  } catch (_e) { /* aşağıda yakalanır */ }
  if (!/^[0-9a-fA-F-]{36}$/.test(hedef)) {
    return yanit({ mesaj: "Geçersiz hesap kimliği." }, 400, koken);
  }

  const yonetici = {
    "apikey": anahtar,
    "Authorization": "Bearer " + anahtar,
    "Content-Type": "application/json",
  };

  // 1. İsteği kim gönderdi? Jetonu Supabase'in kendisine doğrulatıyoruz.
  const benY = await fetch(url + "/auth/v1/user", {
    headers: { "apikey": anahtar, "Authorization": yetki },
  });
  if (!benY.ok) return yanit({ mesaj: "Oturum geçersiz." }, 401, koken);
  const ben = await benY.json();
  const benId = String((ben && ben.id) || "");
  if (!benId) return yanit({ mesaj: "Oturum geçersiz." }, 401, koken);

  if (benId === hedef) {
    return yanit({ mesaj: "Kendi hesabınızı silemezsiniz." }, 403, koken);
  }

  // 2. Çağıran admin mi, hedef kim? Tek sorguda ikisini de okuyoruz.
  const rolY = await fetch(
    url + "/rest/v1/ogrenci?select=id,ad,rol&id=in.(" + benId + "," + hedef + ")",
    { headers: yonetici },
  );
  if (!rolY.ok) return yanit({ mesaj: "Hesap bilgisi okunamadı." }, 500, koken);
  const satirlar = await rolY.json();

  const benSatir = satirlar.find((s: { id: string }) => s.id === benId);
  const hedefSatir = satirlar.find((s: { id: string }) => s.id === hedef);

  if (!benSatir || benSatir.rol !== "admin") {
    return yanit({ mesaj: "Bu işlem için admin yetkisi gerekir." }, 403, koken);
  }
  if (!hedefSatir) {
    return yanit({ mesaj: "Hesap bulunamadı." }, 404, koken);
  }
  if (hedefSatir.rol === "admin") {
    return yanit({ mesaj: "Admin hesapları silinemez. Önce rolü değiştirin." }, 403, koken);
  }

  // 3. Hesabı sil. Diğer tablolar cascade ile temizlenir.
  const silY = await fetch(url + "/auth/v1/admin/users/" + hedef, {
    method: "DELETE",
    headers: yonetici,
  });
  if (!silY.ok) {
    const metin = await silY.text();
    return yanit({ mesaj: "Hesap silinemedi.", ayrinti: metin.slice(0, 300) }, 502, koken);
  }

  return yanit({ silindi: true, id: hedef, ad: hedefSatir.ad }, 200, koken);
});
