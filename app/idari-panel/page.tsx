"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  LogOut, LayoutGrid, Users, Building2, 
  Activity, Clock, Calendar, 
  Search, Briefcase, ChevronRight, X, Phone, MapPin, Truck, CheckCircle, History, CalendarDays, CalendarClock, FileText 
} from "lucide-react";

export default function IdariPanel() {
  const router = useRouter();
  
  // --- STATE'LER ---
  const [loading, setLoading] = useState(true);
  const [ziyaretciler, setZiyaretciler] = useState<any[]>([]);
  const [kampusler, setKampusler] = useState<any[]>([]);
  
  // FİLTRELER (GÜNCELLENDİ: 'tumu' eklendi)
  const [secilenKampus, setSecilenKampus] = useState<number | "hepsi">("hepsi");
  const [aktifStatu, setAktifStatu] = useState<"hepsi" | "iceride" | "bekleyen">("hepsi");
  const [zamanFiltresi, setZamanFiltresi] = useState<"bugun" | "gelecek" | "gecmis" | "tumu">("bugun");
  
  const [secilenZiyaretci, setSecilenZiyaretci] = useState<any>(null);

  const [istatistikler, setIstatistikler] = useState({
    toplam: 0,
    iceride: 0,
    bekleyen: 0
  });

  const tarihNesnesi = new Date();
  const yil = tarihNesnesi.getFullYear();
  const ay = String(tarihNesnesi.getMonth() + 1).padStart(2, '0');
  const gun = String(tarihNesnesi.getDate()).padStart(2, '0');
  const bugunTarihi = `${yil}-${ay}-${gun}`;

  const maskeleTC = (tc: string) => (!tc || tc.length < 11) ? "***********" : `${tc.substring(0, 2)}*******${tc.substring(9, 11)}`;

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    async function baslat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/idari-giris"); return; }

      const { data: guvenlik } = await supabase.from('personel_profilleri').select('id').eq('user_id', user.id).single();
      if (guvenlik) { router.push("/guvenlik-panel"); return; }

      const { data: kampData } = await supabase.from('kampusler').select('*').order('id');
      if (kampData) setKampusler(kampData);
    }
    baslat();
  }, []);

  // --- VERİ ÇEKME FONKSİYONU ---
  const verileriGetir = useCallback(async () => {
    let query = supabase
      .from('talepler')
      .select('*, kampusler(isim)');

    // SIRALAMA MANTIĞI
    if (zamanFiltresi === 'gecmis' || zamanFiltresi === 'tumu') {
        // Geçmiş ve Tümü için EN YENİ en üstte (Azalan tarih)
        query = query.order('ziyaret_tarihi', { ascending: false }).order('ziyaret_saati', { ascending: true });
    } else {
        // Bugün ve Gelecek için EN YAKIN en üstte (Artan tarih)
        query = query.order('ziyaret_tarihi', { ascending: true }).order('ziyaret_saati', { ascending: true });
    }

    // FİLTRELEME MANTIĞI
    if (zamanFiltresi === 'bugun') {
        query = query.eq('ziyaret_tarihi', bugunTarihi);
    } else if (zamanFiltresi === 'gelecek') {
        query = query.gt('ziyaret_tarihi', bugunTarihi);
    } else if (zamanFiltresi === 'gecmis') {
        query = query.lt('ziyaret_tarihi', bugunTarihi).limit(500);
    } else if (zamanFiltresi === 'tumu') {
        query = query.limit(500); // Tüm kayıtlar (Limitli)
    }

    const { data, error } = await query;

    if (!error && data) {
      setZiyaretciler(data);
      const filtrelenmis = secilenKampus === "hepsi" 
        ? data 
        : data.filter(item => item.kampus_id === secilenKampus);

      setIstatistikler({
        toplam: filtrelenmis.length,
        iceride: filtrelenmis.filter((i:any) => i.durum === 'iceride').length,
        bekleyen: filtrelenmis.filter((i:any) => i.durum === 'onaylandi').length
      });
    }
    setLoading(false);
  }, [zamanFiltresi, secilenKampus, bugunTarihi]);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  // --- REALTIME ABONELİK ---
  useEffect(() => {
    const channel = supabase
      .channel('idari_panel_takip')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'talepler' },
        () => { verileriGetir(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [verileriGetir]);

  // --- TABLO FİLTRELEME ---
  const goruntulenecekListe = ziyaretciler.filter(item => {
    const kampusUygun = secilenKampus === "hepsi" ? true : item.kampus_id === secilenKampus;
    
    let statuUygun = true;
    if (aktifStatu === "iceride") statuUygun = item.durum === "iceride";
    if (aktifStatu === "bekleyen") statuUygun = item.durum === "onaylandi";

    return kampusUygun && statuUygun;
  });

  const handleKampusChange = (id: number | "hepsi") => {
    setSecilenKampus(id);
    setAktifStatu("hepsi"); 
  };

  const handleCikis = async () => {
    await supabase.auth.signOut();
    router.push("/idari-giris");
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      
      {/* NAVBAR */}
      <div className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-lg shadow-lg shadow-white/10">
                <img src="/thy logo.png" alt="THY" className="h-8 w-8 object-contain" />
            </div>
            <div className="h-8 w-[1px] bg-white/20"></div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">THY GLOBAL</h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Operasyon Yönetim Merkezi</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-right">
                <div className="text-xs text-slate-400 font-medium">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-sm font-bold text-white">İdari Panel</div>
             </div>
             <button onClick={handleCikis} className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-colors shadow-lg shadow-red-900/20">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        
        {/* --- KAMPÜS VE ZAMAN FİLTRELERİ --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4">
           {/* Kampüsler */}
           <div className="flex flex-wrap gap-2">
             <button 
               onClick={() => handleKampusChange("hepsi")}
               className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${secilenKampus === 'hepsi' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
             >
               <LayoutGrid size={14}/> TÜM LOKASYONLAR
             </button>
             {kampusler.map((kampus) => (
               <button 
                 key={kampus.id}
                 onClick={() => handleKampusChange(kampus.id)}
                 className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${secilenKampus === kampus.id ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
               >
                 <Building2 size={14}/> {kampus.isim.toUpperCase()}
               </button>
             ))}
           </div>
           
           {/* ZAMAN FİLTRESİ (TÜMÜ EKLENDİ) */}
           <div className="bg-slate-200 p-1 rounded-lg flex items-center">
              <button onClick={() => setZamanFiltresi("bugun")} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${zamanFiltresi === 'bugun' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDays size={14}/> BUGÜN</button>
              <button onClick={() => setZamanFiltresi("gelecek")} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${zamanFiltresi === 'gelecek' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarClock size={14}/> GELECEK</button>
              <button onClick={() => setZamanFiltresi("gecmis")} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${zamanFiltresi === 'gecmis' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><History size={14}/> GEÇMİŞ</button>
              
              {/* YENİ BUTON: TÜMÜ */}
              <button onClick={() => setZamanFiltresi("tumu")} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${zamanFiltresi === 'tumu' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={14}/> TÜMÜ</button>
           </div>
        </div>

        {/* --- İSTATİSTİK KARTLARI (Aynı) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div onClick={() => setAktifStatu("hepsi")} className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden group cursor-pointer transition-all duration-300 ${aktifStatu === 'hepsi' ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]' : 'border-slate-100 hover:border-blue-300 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                 <div><p className={`text-[11px] font-black uppercase tracking-widest ${aktifStatu === 'hepsi' ? 'text-blue-600' : 'text-slate-400'}`}>GÜNLÜK TOPLAM ZİYARETÇİ</p><h3 className="text-4xl font-black text-slate-800 mt-2">{istatistikler.toplam}</h3></div>
                 <div className={`p-4 rounded-xl transition-transform group-hover:scale-110 ${aktifStatu === 'hepsi' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}><Users size={28}/></div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[100%]"></div></div>
              {aktifStatu === 'hepsi' && <div className="absolute top-2 right-2 text-blue-500 animate-in zoom-in"><CheckCircle size={16}/></div>}
           </div>

           <div onClick={() => setAktifStatu("iceride")} className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden group cursor-pointer transition-all duration-300 ${aktifStatu === 'iceride' ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.02]' : 'border-slate-100 hover:border-emerald-300 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                 <div><p className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1 ${aktifStatu === 'iceride' ? 'text-emerald-600' : 'text-slate-400'}`}><span className={`w-2 h-2 rounded-full ${aktifStatu === 'iceride' ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`}></span> AKTİF ZİYARETÇİ SAYISI</p><h3 className="text-4xl font-black text-slate-800 mt-2">{istatistikler.iceride}</h3></div>
                 <div className={`p-4 rounded-xl transition-transform group-hover:scale-110 ${aktifStatu === 'iceride' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}><Activity size={28}/></div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-[60%]"></div></div>
              {aktifStatu === 'iceride' && <div className="absolute top-2 right-2 text-emerald-500 animate-in zoom-in"><CheckCircle size={16}/></div>}
           </div>

           <div onClick={() => setAktifStatu("bekleyen")} className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden group cursor-pointer transition-all duration-300 ${aktifStatu === 'bekleyen' ? 'border-orange-500 ring-2 ring-orange-500/20 scale-[1.02]' : 'border-slate-100 hover:border-orange-300 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                 <div><p className={`text-[11px] font-black uppercase tracking-widest ${aktifStatu === 'bekleyen' ? 'text-orange-600' : 'text-slate-400'}`}>GİRİŞ BEKLEYEN MİSAFİRLER</p><h3 className="text-4xl font-black text-slate-800 mt-2">{istatistikler.bekleyen}</h3></div>
                 <div className={`p-4 rounded-xl transition-transform group-hover:scale-110 ${aktifStatu === 'bekleyen' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}><Clock size={28}/></div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[40%]"></div></div>
              {aktifStatu === 'bekleyen' && <div className="absolute top-2 right-2 text-orange-500 animate-in zoom-in"><CheckCircle size={16}/></div>}
           </div>
        </div>

        {/* --- TABLO --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
           <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-700"><Calendar size={20}/></div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       {/* BAŞLIK ETİKETLERİ (Tümü Eklendi) */}
                       {zamanFiltresi === 'bugun' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs uppercase">Bugün</span>}
                       {zamanFiltresi === 'gelecek' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs uppercase">Gelecek Planı</span>}
                       {zamanFiltresi === 'gecmis' && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs uppercase">Arşiv</span>}
                       {zamanFiltresi === 'tumu' && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs uppercase">Tüm Arşiv</span>}
                       Operasyon Listesi
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                       {aktifStatu === 'hepsi' && "Tüm kayıtlar listeleniyor."}
                       {aktifStatu === 'iceride' && "Sadece içerideki misafirler filtrelendi."}
                       {aktifStatu === 'bekleyen' && "Sadece bekleyenler filtrelendi."}
                    </p>
                 </div>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                 <input type="text" placeholder="Listede Ara..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all" />
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                   <tr>
                      <th className="p-4 pl-6">Ziyaretçi</th>
                      <th className="p-4">Lokasyon</th>
                      <th className="p-4">Ziyaret Edilecek Personel</th>
                      <th className="p-4">Zaman</th>
                      <th className="p-4">Statü</th>
                      <th className="p-4 text-center">İşlem</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {loading ? (
                     <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium animate-pulse">Veriler Güncelleniyor...</td></tr>
                   ) : goruntulenecekListe.length === 0 ? (
                     <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium">Bu kriterlere uygun kayıt bulunamadı.</td></tr>
                   ) : (
                     goruntulenecekListe.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                           <td className="p-4 pl-6">
                              <div className="font-bold text-slate-800">{item.ziyaretci_ad_soyad}</div>
                              {item.firma_bilgisi && (
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Briefcase size={10}/> {item.firma_bilgisi}</div>
                              )}
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                 <span className={`w-2 h-2 rounded-full ${item.kampus_id === 1 ? 'bg-blue-500' : item.kampus_id === 2 ? 'bg-orange-500' : 'bg-purple-500'}`}></span>
                                 <span className="text-sm font-medium text-slate-600">{item.kampusler ? item.kampusler.isim : "Bilinmiyor"}</span>
                              </div>
                           </td>
                           <td className="p-4 text-sm text-slate-700 font-medium">{item.ziyaret_edilecek_kisi}</td>
                           <td className="p-4"><div className="font-bold text-slate-800 text-sm">{item.ziyaret_saati}</div><div className="text-xs text-slate-400">{item.ziyaret_tarihi.split('-').reverse().join('.')}</div></td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                 item.durum === 'iceride' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                 item.durum === 'cikis_yapti' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                                 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                 {item.durum === 'iceride' ? 'İÇERİDE' : item.durum === 'cikis_yapti' ? 'ÇIKIŞ YAPTI' : 'BEKLİYOR'}
                              </span>
                           </td>
                           <td className="p-4 text-center">
                              <button onClick={() => setSecilenZiyaretci(item)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all cursor-pointer"><ChevronRight size={20} /></button>
                           </td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
           </div>
           
           <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center font-medium">
              Gösterilen Kayıt Sayısı: {goruntulenecekListe.length}
           </div>
        </div>

      </div>

      {/* DETAY MODAL (Aynı Kaldı) */}
      {secilenZiyaretci && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
              <div><h2 className="font-bold text-lg">{secilenZiyaretci.ziyaretci_ad_soyad}</h2><p className="text-xs text-slate-400 font-mono">TC: {maskeleTC(secilenZiyaretci.ziyaretci_tc)}</p></div>
              <button onClick={() => setSecilenZiyaretci(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-slate-50">
               <div className={`p-4 rounded-xl border flex items-center gap-3 ${secilenZiyaretci.durum === 'iceride' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  <Activity size={20} />
                  <div><div className="text-xs font-bold uppercase opacity-70">Güncel Durum</div><div className="font-black text-sm uppercase">{secilenZiyaretci.durum}</div></div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Building2 size={12}/> Kampüs</div><div className="font-bold text-slate-800 text-sm">{secilenZiyaretci.kampusler ? secilenZiyaretci.kampusler.isim : "Bilinmiyor"}</div></div>
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Calendar size={12}/> Tarih</div><div className="font-bold text-slate-800 text-sm">{secilenZiyaretci.ziyaret_tarihi.split('-').reverse().join('.')}</div></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Clock size={12}/> Saat</div><div className="font-bold text-slate-800 text-sm">{secilenZiyaretci.ziyaret_saati}</div></div>
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Phone size={12}/> GSM</div><div className="font-bold text-slate-800 text-sm">{secilenZiyaretci.ziyaretci_gsm || "-"}</div></div>
                 </div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-2 border-b pb-1">Ziyaret Detayları</div>
                  <div className="grid grid-cols-1 gap-3">
                     <div><span className="text-xs text-slate-500">Ziyaret Edilecek Personel:</span> <span className="font-bold text-slate-800 ml-1">{secilenZiyaretci.ziyaret_edilecek_kisi}</span></div>
                     <div><span className="text-xs text-slate-500">Sebep:</span> <span className="font-medium text-slate-800 ml-1 bg-slate-100 px-2 py-0.5 rounded">{secilenZiyaretci.ziyaret_nedeni}</span></div>
                  </div>
               </div>
               {(secilenZiyaretci.plaka || secilenZiyaretci.firma_bilgisi) && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                   <h3 className="text-xs font-black text-blue-400 uppercase mb-3">Lojistik Bilgiler</h3>
                   <div className="grid grid-cols-2 gap-4">
                      {secilenZiyaretci.plaka && <div><div className="flex items-center gap-1 text-xs text-blue-500 mb-1"><Truck size={12}/> Plaka</div><div className="font-black text-slate-900 font-mono bg-white px-2 py-1 rounded inline-block border border-blue-200">{secilenZiyaretci.plaka}</div></div>}
                      {secilenZiyaretci.firma_bilgisi && <div><div className="flex items-center gap-1 text-xs text-blue-500 mb-1"><Briefcase size={12}/> Firma</div><div className="font-bold text-slate-800">{secilenZiyaretci.firma_bilgisi}</div></div>}
                   </div>
                </div>
               )}
            </div>
            <div className="bg-white p-4 border-t flex justify-end"><button onClick={() => setSecilenZiyaretci(null)} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors">Kapat</button></div>
           </div>
        </div>
      )}

    </main>
  );
}