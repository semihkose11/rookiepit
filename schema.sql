-- =====================================================================
--  FRC Çalışma Programı · veritabanı şeması
--  Supabase SQL Editor'da bu dosyanın tamamını bir kez çalıştırın.
--
--  Tasarımın tek önemli kuralı şudur: puanlar bir kez yazılır, bir daha
--  değiştirilemez. Bu kural sayfada değil, veritabanında uygulanır;
--  dolayısıyla tarayıcı araçlarıyla oynayarak aşılamaz.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Öğrenci kaydı
-- ---------------------------------------------------------------------
create table if not exists public.ogrenci (
  id         uuid primary key references auth.users on delete cascade,
  ad         text not null check (length(trim(ad)) between 2 and 60),
  rol        text not null default 'ogrenci'
             check (rol in ('ogrenci','mentor','admin')),
  kayit      timestamptz not null default now()
);

-- Yeni bir hesap açıldığında kayıt satırı kendiliğinden oluşur.
create or replace function public.yeni_hesap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v text;
begin
  -- E-posta ile kayıtta ad 'ad' alanından gelir. Google ile girişte
  -- Google 'full_name' veya 'name' gönderir; hiçbiri yoksa e-postanın
  -- @ işaretinden önceki kısmı kullanılır.
  v := coalesce(
         nullif(trim(new.raw_user_meta_data->>'ad'), ''),
         nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
         nullif(trim(new.raw_user_meta_data->>'name'), ''),
         nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
         '');
  if length(v) < 2 then v := 'İsimsiz'; else v := left(v, 60); end if;

  insert into public.ogrenci (id, ad)
  values (new.id, v)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists yeni_hesap_trg on auth.users;
create trigger yeni_hesap_trg
  after insert on auth.users
  for each row execute function public.yeni_hesap();

-- ---------------------------------------------------------------------
-- 2. Tuval puanı — modül başına tek satır, yalnızca bir kez yazılır
-- ---------------------------------------------------------------------
create table if not exists public.tuval (
  kullanici uuid not null references auth.users on delete cascade,
  modul     text not null,
  puan      smallint not null check (puan between 0 and 100),
  yazildi   timestamptz not null default now(),
  primary key (kullanici, modul)
);

-- ---------------------------------------------------------------------
-- 3. Test cevapları — soru başına tek satır, yalnızca bir kez yazılır
-- ---------------------------------------------------------------------
create table if not exists public.cevap (
  kullanici uuid not null references auth.users on delete cascade,
  modul     text not null,
  soru      text not null,
  dogru     boolean not null,
  yazildi   timestamptz not null default now(),
  primary key (kullanici, soru)
);

create index if not exists cevap_modul_idx on public.cevap (kullanici, modul);

-- ---------------------------------------------------------------------
-- 4. Görevler ve atamalar
--
--    Bu bölüm ödev, okuma ve modül ataması için altyapıdır. İçerik
--    doldurulmadan da tablolar çalışır; antrenör panelinden görev
--    oluşturulup öğrencilere atanabilir.
--
--    Akış: gorev (tanım) -> atama (kime verildi) -> teslim (öğrenci
--    yaptı dedi) -> degerlendirme (antrenör puanladı).
-- ---------------------------------------------------------------------
create table if not exists public.gorev (
  id          uuid primary key default gen_random_uuid(),
  olusturan   uuid not null references auth.users on delete cascade,
  tur         text not null default 'odev'
              check (tur in ('modul','odev','okuma','serbest')),
  baslik      text not null check (length(trim(baslik)) between 3 and 120),
  aciklama    text check (aciklama is null or length(aciklama) <= 2000),
  modul       text,        -- tur='modul' iken modül id'si, örn. cad-02-sketching
  baglanti    text check (baglanti is null or baglanti ~ '^https?://'),
  son_tarih   date,
  kapali      boolean not null default false,
  olusturuldu timestamptz not null default now()
);

create index if not exists gorev_olusturan_idx on public.gorev (olusturan, olusturuldu desc);

create table if not exists public.atama (
  gorev    uuid not null references public.gorev on delete cascade,
  ogrenci  uuid not null references auth.users on delete cascade,
  atandi   timestamptz not null default now(),
  primary key (gorev, ogrenci)
);

create index if not exists atama_ogrenci_idx on public.atama (ogrenci);

create table if not exists public.teslim (
  gorev    uuid not null references public.gorev on delete cascade,
  ogrenci  uuid not null references auth.users on delete cascade,
  aciklama text check (aciklama is null or length(aciklama) <= 1000),
  teslim   timestamptz not null default now(),
  primary key (gorev, ogrenci)
);

create table if not exists public.degerlendirme (
  gorev    uuid not null references public.gorev on delete cascade,
  ogrenci  uuid not null references auth.users on delete cascade,
  puan     smallint check (puan is null or puan between 0 and 100),
  yorum    text check (yorum is null or length(yorum) <= 1000),
  yazan    uuid not null references auth.users on delete cascade,
  yazildi  timestamptz not null default now(),
  primary key (gorev, ogrenci)
);

-- ---------------------------------------------------------------------
-- 5. Yetki kontrolü
--    mentor : ilerlemeyi görür, görev atar, teslimi puanlar
--    admin  : mentörün yaptığı her şey, ayrıca rol verme yetkisi
-- ---------------------------------------------------------------------
create or replace function public.koc_mu()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ogrenci
    where id = auth.uid() and rol in ('mentor','admin')
  );
$$;

-- Rol verme yetkisi yalnızca admin'de.
create or replace function public.admin_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ogrenci
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 6. Satır düzeyinde güvenlik
--    Dikkat: hiçbir tabloda UPDATE veya DELETE politikası yoktur.
--    Politika olmadığı için bu işlemler herkese kapalıdır. Puanın
--    değiştirilemez olmasını sağlayan şey budur.
-- ---------------------------------------------------------------------
alter table public.ogrenci enable row level security;
alter table public.tuval   enable row level security;
alter table public.cevap   enable row level security;

drop policy if exists ogrenci_oku on public.ogrenci;
create policy ogrenci_oku on public.ogrenci
  for select to authenticated
  using (id = auth.uid() or public.koc_mu());

drop policy if exists ogrenci_ad_guncelle on public.ogrenci;
create policy ogrenci_ad_guncelle on public.ogrenci
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = 'ogrenci');

drop policy if exists tuval_oku on public.tuval;
create policy tuval_oku on public.tuval
  for select to authenticated
  using (kullanici = auth.uid() or public.koc_mu());

drop policy if exists tuval_yaz on public.tuval;
create policy tuval_yaz on public.tuval
  for insert to authenticated
  with check (kullanici = auth.uid());

drop policy if exists cevap_oku on public.cevap;
create policy cevap_oku on public.cevap
  for select to authenticated
  using (kullanici = auth.uid() or public.koc_mu());

drop policy if exists cevap_yaz on public.cevap;
create policy cevap_yaz on public.cevap
  for insert to authenticated
  with check (kullanici = auth.uid());

-- Görev tabloları
alter table public.gorev         enable row level security;
alter table public.atama         enable row level security;
alter table public.teslim        enable row level security;
alter table public.degerlendirme enable row level security;

-- Bir görevi ya onu oluşturan koç görür, ya da o görev kendisine atanmış
-- öğrenci görür. Başkasına atanmış görevler görünmez.
drop policy if exists gorev_oku on public.gorev;
create policy gorev_oku on public.gorev
  for select to authenticated
  using (
    public.koc_mu()
    or exists (select 1 from public.atama a
               where a.gorev = gorev.id and a.ogrenci = auth.uid())
  );

drop policy if exists gorev_yaz on public.gorev;
create policy gorev_yaz on public.gorev
  for insert to authenticated
  with check (public.koc_mu() and olusturan = auth.uid());

drop policy if exists gorev_guncelle on public.gorev;
create policy gorev_guncelle on public.gorev
  for update to authenticated
  using (public.koc_mu()) with check (public.koc_mu());

drop policy if exists gorev_sil on public.gorev;
create policy gorev_sil on public.gorev
  for delete to authenticated
  using (public.koc_mu());

drop policy if exists atama_oku on public.atama;
create policy atama_oku on public.atama
  for select to authenticated
  using (ogrenci = auth.uid() or public.koc_mu());

drop policy if exists atama_yaz on public.atama;
create policy atama_yaz on public.atama
  for insert to authenticated
  with check (public.koc_mu());

drop policy if exists atama_sil on public.atama;
create policy atama_sil on public.atama
  for delete to authenticated
  using (public.koc_mu());

-- Teslimi öğrenci kendisi yazar ve gerekirse düzeltir. Yalnızca kendisine
-- atanmış bir görev için teslim verebilir.
drop policy if exists teslim_oku on public.teslim;
create policy teslim_oku on public.teslim
  for select to authenticated
  using (ogrenci = auth.uid() or public.koc_mu());

drop policy if exists teslim_yaz on public.teslim;
create policy teslim_yaz on public.teslim
  for insert to authenticated
  with check (
    ogrenci = auth.uid()
    and exists (select 1 from public.atama a
                where a.gorev = teslim.gorev and a.ogrenci = auth.uid())
  );

drop policy if exists teslim_guncelle on public.teslim;
create policy teslim_guncelle on public.teslim
  for update to authenticated
  using (ogrenci = auth.uid()) with check (ogrenci = auth.uid());

drop policy if exists teslim_sil on public.teslim;
create policy teslim_sil on public.teslim
  for delete to authenticated
  using (ogrenci = auth.uid());

-- Değerlendirmeyi yalnızca koç yazar; öğrenci kendi değerlendirmesini okur.
drop policy if exists degerlendirme_oku on public.degerlendirme;
create policy degerlendirme_oku on public.degerlendirme
  for select to authenticated
  using (ogrenci = auth.uid() or public.koc_mu());

drop policy if exists degerlendirme_yaz on public.degerlendirme;
create policy degerlendirme_yaz on public.degerlendirme
  for insert to authenticated
  with check (public.koc_mu() and yazan = auth.uid());

drop policy if exists degerlendirme_guncelle on public.degerlendirme;
create policy degerlendirme_guncelle on public.degerlendirme
  for update to authenticated
  using (public.koc_mu()) with check (public.koc_mu());

-- Hesap kaydını güncellemek (ad düzeltmek, rol vermek) yalnızca
-- admin'e açıktır. Mentör rol veremez.
drop policy if exists ogrenci_koc_guncelle on public.ogrenci;
drop policy if exists ogrenci_admin_guncelle on public.ogrenci;
create policy ogrenci_admin_guncelle on public.ogrenci
  for update to authenticated
  using (public.admin_mi()) with check (public.admin_mi());

-- ---------------------------------------------------------------------
-- 7. Mentör tablosu için birleşik görünüm
-- ---------------------------------------------------------------------
create or replace view public.ozet
with (security_invoker = true) as
select
  o.id                                   as kullanici,
  o.ad,
  m.modul,
  t.puan                                 as tuval,
  count(c.soru) filter (where c.dogru)   as dogru,
  count(c.soru)                          as cevaplanan
from public.ogrenci o
cross join (select distinct modul from public.cevap
            union select distinct modul from public.tuval) m
left join public.tuval t on t.kullanici = o.id and t.modul = m.modul
left join public.cevap c on c.kullanici = o.id and c.modul = m.modul
group by o.id, o.ad, m.modul, t.puan;

-- ---------------------------------------------------------------------
-- 8. Kendinizi koç yapmak için, hesabı açtıktan sonra bir kez çalıştırın:
--    update public.ogrenci set rol = 'admin' where id = 'BURAYA_KULLANICI_ID';
--    Kullanıcı id'sini Supabase panelinde Authentication > Users altında
--    bulabilirsiniz.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 8. Giriş kaydı
-- ---------------------------------------------------------------------

create table if not exists public.giris_kaydi (
  id        bigint generated always as identity primary key,
  kullanici uuid not null references auth.users (id) on delete cascade,
  ad        text not null default '',
  eposta    text not null default '',
  zaman     timestamptz not null default now()
);

create index if not exists giris_kaydi_zaman_idx
  on public.giris_kaydi (zaman desc);
create index if not exists giris_kaydi_kullanici_idx
  on public.giris_kaydi (kullanici, zaman desc);

alter table public.giris_kaydi enable row level security;

-- Kişi yalnızca kendi girişini yazabilir.
drop policy if exists giris_yaz on public.giris_kaydi;
create policy giris_yaz on public.giris_kaydi
  for insert to authenticated
  with check (kullanici = auth.uid());

-- Giriş kaydını yalnızca admin okuyabilir. Mentörün erişimi yoktur ve
-- öğrenci kendi kaydını da göremez. Yazma açıktır: herkes kendi giriş
-- satırını ekler, kimse okumaz.
drop policy if exists giris_oku on public.giris_kaydi;
create policy giris_oku on public.giris_kaydi
  for select to authenticated
  using (public.admin_mi());

-- Günlük özet: raporun dayandığı görünüm.
create or replace view public.giris_gunluk as
  select (zaman at time zone 'Europe/Istanbul')::date as gun,
         count(*)                as giris_sayisi,
         count(distinct kullanici) as kisi_sayisi
    from public.giris_kaydi
   group by 1
   order by 1 desc;
