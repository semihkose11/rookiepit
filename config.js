/* =====================================================================
   FRC Çalışma Programı · bağlantı ayarları

   Supabase panelinde Project Settings > API altındaki iki değer
   aşağıya yazılır. publishable (anon) anahtarı gizli değildir;
   tarayıcıda görünmek üzere tasarlanmıştır. Asıl koruma
   veritabanındaki satır düzeyinde güvenlik kurallarıdır.

   Panelde "Secret keys" altındaki anahtar buraya asla yazılmaz; o
   anahtar bütün kuralları atlar ve bu depo herkese açıktır.

   Bu iki alan boş bırakılırsa program giriş istemez ve ilerlemeyi
   yalnızca tarayıcıya kaydeder.
   ===================================================================== */
window.FRC_CONFIG = {
  url:  "https://oeotfegioxqvkkxodgxx.supabase.co",
  key:  "sb_publishable_EYZoFTR2MMJc2JH7XcjJug_oYVFZnWk",
  girisSayfasi: "giris.html"
};
