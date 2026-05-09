// lib/formatlayici.ts

export const maskeleTC = (tc: string): string => {
  if (!tc || tc.length < 11) return "***********";
  return `${tc.substring(0, 2)}*******${tc.substring(9, 11)}`;
};

export const formatTarih = (tarih: string): string => {
  if (!tarih) return "-";
  return tarih.split('-').reverse().join('.');
};

export const maskeleTelefon = (tel: string): string => {
  if (!tel) return "-";
  const digits = tel.replace(/\D/g, "");
  if (digits.length < 7) return tel;
  return `${digits.slice(0, 3)} **** ${digits.slice(-2)}`;
};
