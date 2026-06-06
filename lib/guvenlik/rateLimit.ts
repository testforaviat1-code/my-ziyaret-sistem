import "server-only";

// UYARI: instance-içi (process-local). Üretimde gateway/WAF veya Redis ile değiştirilmeli.
const KOVA = new Map<string, { adet: number; sifirla: number }>();

/** true → limit aşıldı. Anahtar: genelde kullanıcı id'si. */
export function hizSiniriAsildi(anahtar: string, limit = 10, pencereMs = 60_000): boolean {
  const simdi = Date.now();
  const kayit = KOVA.get(anahtar);
  if (!kayit || simdi > kayit.sifirla) {
    KOVA.set(anahtar, { adet: 1, sifirla: simdi + pencereMs });
    return false;
  }
  kayit.adet += 1;
  return kayit.adet > limit;
}
