import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Uygulama genelinde tanınan kurumsal rol kümesi.
 * SSO geçişinde IdP claim'leri bu union'a map'lenecek.
 */
export type Rol = "personel" | "guvenlik" | "admin";

/**
 * Uygulamanın geri kalanının tanıdığı TEK kimlik sözleşmesi.
 * Bileşenler, repository'ler ve action'lar Supabase'i değil bunu tanır.
 */
export interface AuthUser {
  id: string;
  sicilNo: string;
  rol: Rol;
  kampusId: number | null;
  tamAd: string | null;
}

const GECERLI_ROLLER: readonly Rol[] = ["personel", "guvenlik", "admin"];

function rolDogrula(deger: unknown): Rol | null {
  return GECERLI_ROLLER.includes(deger as Rol) ? (deger as Rol) : null;
}

/**
 * Oturum açmış kullanıcının standart kimlik nesnesini döndürür.
 *
 * BUGÜN: Supabase Auth + `profiller` tablosu.
 * YARIN (SSO): Bu fonksiyonun gövdesi Keycloak/Azure AD token doğrulamasıyla değiştirilir;
 *              dönüş tipi (AuthUser) aynı kaldığı için uygulamanın geri kalanı dokunulmaz.
 *
 * @returns AuthUser | null  (oturum yok / profil bulunamadı / geçersiz rol → null)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profil, error: profilError } = await supabase
    .from("profiller")
    .select("rol, sicil_no, kampus_id, tam_ad")
    .eq("id", user.id)
    .single();

  if (profilError || !profil) return null;

  const rol = rolDogrula(profil.rol);
  if (!rol) return null;

  const sicilNo = (profil.sicil_no ?? user.email?.split("@")[0] ?? "").trim();

  return {
    id: user.id,
    sicilNo,
    rol,
    kampusId: profil.kampus_id ?? null,
    tamAd: profil.tam_ad ?? null,
  };
}

/**
 * Belirli rolleri zorunlu kılan kapı. Yetki yoksa fırlatır.
 * Repository ve action'larda tek satırlık yetki kontrolü için.
 */
export async function requireRoller(...izinliRoller: Rol[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı.");
  if (izinliRoller.length > 0 && !izinliRoller.includes(user.rol)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return user;
}
