"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, Briefcase, 
  Truck, Activity, CheckCircle2, XCircle, Search, ShieldAlert, FileText 
} from "lucide-react";

export default function Taleplerim() {
   const supabase = createClient();
  const router = useRouter();
  const [talepler, setTalepler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<"aktif" | "gecmis">("aktif");

  useEffect(() => {
    async function verileriGetir() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // 1. ADIM: Personelin kendi profil bilgilerini alıyoruz
      const { data: profil } = await supabase
        .from('profiller')
        .select('tam_ad, id')
        .eq('id', user.id)
        .single();

      // 2. ADIM: Eşleşme için kullanacağımız anahtarları belirliyoruz
      const sicilNo = (user.email?.split('@')[0] || "").trim().toLowerCase();
      const personelTamAd = (profil?.tam_ad || "").trim().toLowerCase();

      // 3. ADIM: Tüm talepleri çekip "Zırhlı Filtreleme" yapıyoruz
      const { data, error } = await supabase
        .from('talepler')
        .select('*, kampusler(isim)')
        .order('id', { ascending: false });

      if (!error && data) {
        const banaAitTalepler = data.filter(talep => {
          const personel  = (talep.ziyaret_edilecek_kisi || "").toLowerCase().trim();
          
          // EŞLEŞME KONTROLÜ: Veritabanındaki "personel" alanı; 
          // sicilinle, tam adınla veya mailinle tutuyor mu?
          return (
            personel === sicilNo || 
            personel === personelTamAd || 
            (personel.length > 3 && (personelTamAd.includes(personel) || sicilNo.includes(personel)))
          );
        });
        setTalepler(banaAitTalepler);
      }
      setLoading(false);
    }
    verileriGetir();
  }, [router]);

  const maskeleTC = (tc: string) => (!tc || tc.length < 11) ? "***********" : `${tc.substring(0, 2)}*******${tc.substring(9, 11)}`;
  const formatTarih = (tarih: string) => (!tarih) ? "-" : tarih.split('-').reverse().join('.');

  const goruntulenecekTalepler = talepler.filter(talep => {
      const isAktif = talep.durum === 'onaylandi' || talep.durum === 'iceride';
      if (filtre === 'aktif' && !isAktif) return false;
      if (filtre === 'gecmis' && isAktif) return false;
      if (arama && !talep.ziyaretci_ad_soyad.toLocaleLowerCase('tr-TR').includes(arama.toLocaleLowerCase('tr-TR'))) return false;
      return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700">
      <div className="max-w-5xl mx-auto mb-8 bg-slate-900 p-6 rounded-2xl shadow-xl border-b-4 border-blue-500 flex justify-between items-center text-white">
         <div className="flex items-center gap-4">
            <Link href="/" className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"><ArrowLeft size={24}/></Link>
            <div>
               <h1 className="text-2xl font-black tracking-wide flex items-center gap-2 uppercase"><User className="text-blue-400"/> TALEPLERİM</h1>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Giriş Kayıtlarınız ve Durum Takibi</p>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
               <button onClick={() => setFiltre("aktif")} className={`flex-1 md:px-8 py-2 rounded-md text-sm font-bold transition-all ${filtre === 'aktif' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Aktif Randevular</button>
               <button onClick={() => setFiltre("gecmis")} className={`flex-1 md:px-8 py-2 rounded-md text-sm font-bold transition-all ${filtre === 'gecmis' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>Geçmiş / Kapananlar</button>
            </div>
            <div className="relative w-full md:w-72">
               <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
               <input type="text" placeholder="İsim Ara..." value={arama} onChange={(e) => setArama(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
            </div>
         </div>

         <div className="space-y-4">
            {loading ? (
               <div className="text-center p-12 text-slate-400 font-bold animate-pulse uppercase tracking-widest">Yükleniyor...</div>
            ) : goruntulenecekTalepler.length === 0 ? (
               <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500 font-medium tracking-tight">Eşleşen bir randevu kaydı bulunamadı.</div>
            ) : (
               goruntulenecekTalepler.map((talep) => (
                  <div key={talep.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${talep.durum === 'iceride' ? 'bg-emerald-500' : talep.durum === 'reddedildi' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                     <div className="flex-1 pl-4 w-full">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{talep.ziyaretci_ad_soyad}</h3>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${talep.durum === 'iceride' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : talep.durum === 'reddedildi' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100'}`}>
                              {talep.durum === 'iceride' ? 'İçeride' : talep.durum === 'reddedildi' ? 'Reddedildi' : 'Bekliyor'}
                           </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-5 font-bold text-sm">
                           <div><p className="text-[10px] text-slate-400 uppercase mb-1">Tarih</p>{formatTarih(talep.ziyaret_tarihi)} - {talep.ziyaret_saati}</div>
                           <div><p className="text-[10px] text-slate-400 uppercase mb-1">Yerleşke</p>{talep.kampusler?.isim || "-"}</div>
                           <div><p className="text-[10px] text-slate-400 uppercase mb-1">TC Kimlik</p>{maskeleTC(talep.ziyaretci_tc)}</div>
                           <div><p className="text-[10px] text-slate-400 uppercase mb-1">Araç Plaka</p>{talep.plaka || "Yok"}</div>
                        </div>
                        {talep.durum === 'reddedildi' && (
                           <div className="mt-5 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                              <ShieldAlert className="text-red-500 mt-0.5" size={20}/>
                              <div>
                                 <p className="text-xs font-black text-red-600 uppercase">Güvenlik Red Açıklaması:</p>
                                 <p className="text-sm font-semibold text-slate-700 mt-1 italic">"{talep.red_nedeni || "Neden belirtilmemiş."}"</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    </main>
  );
}