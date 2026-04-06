"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { guvenlikIslemi, topluGuvenlikIslemi } from "@/app/actions/guvenlik";
import { 
  
  LogOut, ShieldAlert, RefreshCw, X, 
  Phone, User, Calendar, Clock, MapPin, FileText, Truck, Briefcase, Filter, UserCheck, Activity, Users, Car, Home, Building2, ChevronRight, ArrowUpDown
} from "lucide-react";
import Link from "next/link";

export default function GuvenlikPanel() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- STATE'LER ---
  const [ziyaretciler, setZiyaretciler] = useState<any[]>([]);
  const [aramaMetni, setAramaMetni] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenZiyaretci, setSecilenZiyaretci] = useState<any>(null);

  // REDDETME MODALI İÇİN STATE'LER
  const [showRedModal, setShowRedModal] = useState(false);
  const [redNedeni, setRedNedeni] = useState("");

  // YENİ: ÇOKLU SEÇİM (TOPLU ÇIKIŞ) STATE'İ
  const [seciliZiyaretciler, setSeciliZiyaretciler] = useState<number[]>([]);

  // SIRALAMA STATE'İ
  const [siralama, setSiralama] = useState<string>("eskiden-yeniye");

  // Personel & Kampüs Bilgisi
  const [personelKampus, setPersonelKampus] = useState<any>(null); 
  const [personelAdi, setPersonelAdi] = useState<string>("");
  const [yetkiHatasi, setYetkiHatasi] = useState(false);
  
  // ADMIN İÇİN ÖZEL STATE'LER
  const [isAdmin, setIsAdmin] = useState(false);
  const [tumKampusler, setTumKampusler] = useState<any[]>([]);
  const [adminSecilenKampusId, setAdminSecilenKampusId] = useState<number | null>(null);

  // Filtreler
  const [aktifFiltre, setAktifFiltre] = useState<"bugun" | "gelecek" | "gecmis" | "tumu">("bugun");
  const [durumFiltresi, setDurumFiltresi] = useState<string>("hepsi");

  // Hydration Fix
  const [mounted, setMounted] = useState(false);
  const [zaman, setZaman] = useState<Date | null>(null);

  // İstatistikler 
  const istatistikler = {
    toplam: ziyaretciler.length,
    iceride: ziyaretciler.filter(k => k.durum === 'iceride').length,
    bekleyen: ziyaretciler.filter(k => k.durum === 'onaylandi').length,
    cikan: ziyaretciler.filter(k => k.durum === 'cikis_yapti' || k.durum === 'reddedildi').length
  };

  const bugunTarihi = new Date().toISOString().split('T')[0];
  const maskeleTC = (tc: string) => (!tc || tc.length < 11) ? "***********" : `${tc.substring(0, 2)}*******${tc.substring(9, 11)}`;
  const formatTarih = (tarih: string) => (!tarih) ? "-" : tarih.split('-').reverse().join('.');

  // --- 1. MOUNT VE SAAT AYARI ---
  useEffect(() => {
    setMounted(true);
    setZaman(new Date());
    const timer = setInterval(() => setZaman(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. YETKİ KONTROLÜ ---
  useEffect(() => {
    async function personelYetkisiGetir() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profil, error } = await supabase
        .from('profiller')
        .select('id, rol, kampus_id, tam_ad, kampusler(isim)')
        .eq('id', user.id)
        .single();

      if (error || !profil) {
        setYetkiHatasi(true); 
        setYukleniyor(false);
      } else {
        if (profil.rol === 'admin') {
            setIsAdmin(true);
            setPersonelAdi(profil.tam_ad + " (Yönetici)");
         
            const { data: kampusData } = await supabase.from('kampusler').select('*');
            if (kampusData) setTumKampusler(kampusData);
            setYukleniyor(false); 
        } else if (profil.rol === 'guvenlik') {
            setPersonelAdi(profil.tam_ad || "Güvenlik Personeli");
            setPersonelKampus({
              id: profil.kampus_id,
              isim: profil.kampusler ? (profil.kampusler as any).isim : 'Genel Merkez'
            });
        } else {
            setYetkiHatasi(true);
        }
      }
    }
    personelYetkisiGetir();
  }, [router]);

  // --- 3. VERİLERİ GETİR ---
  const verileriGetir = async () => {
    const hedefKampusId = isAdmin ? adminSecilenKampusId : (personelKampus ? personelKampus.id : null);
    if (!hedefKampusId) return; 

    setYukleniyor(true);
    setSeciliZiyaretciler([]); // Filtre değişince seçimleri sıfırla

    let query = supabase
      .from("talepler")
      .select("*, kampusler(isim)") 
      .eq('kampus_id', hedefKampusId);

    if (aktifFiltre === "bugun") {
      query = query.eq("ziyaret_tarihi", bugunTarihi);
    } else if (aktifFiltre === "gelecek") {
      query = query.gt("ziyaret_tarihi", bugunTarihi);
    } else if (aktifFiltre === "gecmis") {
      query = query.lt("ziyaret_tarihi", bugunTarihi);
    } else if (aktifFiltre === "tumu") {
      query = query.limit(500);
    }

    const { data, error } = await query;
    if (!error) setZiyaretciler(data || []);
    setYukleniyor(false);
  };

  useEffect(() => {
    if (personelKampus || (isAdmin && adminSecilenKampusId)) {
      verileriGetir();
    }
  }, [personelKampus, adminSecilenKampusId, aktifFiltre]);

  const adminKampusSec = (kampus: any) => {
      setAdminSecilenKampusId(kampus.id);
      setPersonelKampus({ id: kampus.id, isim: kampus.isim }); 
  };

  // --- İŞLEMLER ---
  const durumGuncelle = async (id: number, yeniDurum: string, n: string = "", e?: any) => {
    if(e) e.stopPropagation();
    
    const payload: any = { 
      durum: yeniDurum,
      islem_yapan_guvenlik: personelAdi 
    };
    if (yeniDurum === 'reddedildi') payload.red_nedeni = n;

    const { error } = await supabase.from("talepler").update(payload).eq("id", id);
    
    if (!error) {
      // 1. Kendi ekranındaki listeyi günceller
      setZiyaretciler((liste) => liste.map((k) => k.id === id ? { ...k, durum: yeniDurum, red_nedeni: n, islem_yapan_guvenlik: personelAdi } : k));

      // --- İŞTE SENİN İSTEDİĞİN O SİHİRLİ DOKUNUŞ BURASI ---
      if (yeniDurum === 'reddedildi') {
        alert("İşlem başarıyla tamamlandı!");
        setShowRedModal(false); // Kırmızı reddetme kutusunu kapatır
        setSecilenZiyaretci(null); // Detay penceresini kapatır
        window.location.reload(); // Sayfayı yenileyip tertemiz yapar
      }
      // -----------------------------------------------------
    }
  };

  // YENİ: SEÇİLENLERİ TOPLU ÇIKIŞ YAP
  const topluCikisYap = async () => {
    if (seciliZiyaretciler.length === 0) return;
    const onayi = window.confirm(`${seciliZiyaretciler.length} ziyaretçinin çıkış işlemini onaylıyor musunuz?`);
    if (!onayi) return;

    // Ekranı güncelle
    setZiyaretciler((liste) => liste.map((k) => seciliZiyaretciler.includes(k.id) ? { ...k, durum: 'cikis_yapti', islem_yapan_guvenlik: personelAdi } : k));
    const islemListesi = [...seciliZiyaretciler];
    setSeciliZiyaretciler([]); 

    try {
      // Çelik kasaya gönder
      await topluGuvenlikIslemi(islemListesi);
      
window.location.reload();
    } catch (error: any) {
      alert("Hata: " + error.message);
      verileriGetir();
    }
  };

  const cikisYap = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- SIRALAMA VE FİLTRELEME MANTIĞI ---
  const parseDateTime = (tarihStr: string, saatStr: string) => {
    const temizSaat = saatStr ? saatStr.split('-')[0].trim() : "00:00";
    return new Date(`${tarihStr}T${temizSaat}`).getTime();
  };

  const filtrelenmisVeSiralanmisListe = ziyaretciler
    .filter((kisi) => {
      const metin = aramaMetni.toLowerCase();
      const aramaSonucu = 
        kisi.ziyaretci_ad_soyad?.toLowerCase().includes(metin) ||
        kisi.ziyaretci_tc?.includes(metin) ||
        kisi.plaka?.toLowerCase().includes(metin);

      if (!aramaSonucu) return false;

      if (durumFiltresi === 'hepsi') return true;
      if (durumFiltresi === 'iceride' && kisi.durum === 'iceride') return true;
      if (durumFiltresi === 'onaylandi' && kisi.durum === 'onaylandi') return true;
      if (durumFiltresi === 'cikis_yapti' && (kisi.durum === 'cikis_yapti' || kisi.durum === 'reddedildi')) return true;

      return false;
    })
    .sort((a, b) => {
      const zamanA = parseDateTime(a.ziyaret_tarihi, a.ziyaret_saati);
      const zamanB = parseDateTime(b.ziyaret_tarihi, b.ziyaret_saati);

      if (siralama === "yeniden-eskiye") return zamanB - zamanA;
      if (siralama === "eskiden-yeniye") return zamanA - zamanB;
      
      if (siralama === "a-z") return a.ziyaretci_ad_soyad.localeCompare(b.ziyaretci_ad_soyad);
      if (siralama === "z-a") return b.ziyaretci_ad_soyad.localeCompare(a.ziyaretci_ad_soyad);

      return 0;
    });

  // YENİ: ÇOKLU SEÇİM FONKSİYONLARI
  const gorunenIceridekiler = filtrelenmisVeSiralanmisListe.filter(k => k.durum === 'iceride');
  
  const handleSecim = (id: number) => {
    setSeciliZiyaretciler(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleTumunuSec = () => {
    if (seciliZiyaretciler.length === gorunenIceridekiler.length && gorunenIceridekiler.length > 0) {
      setSeciliZiyaretciler([]);
    } else {
      setSeciliZiyaretciler(gorunenIceridekiler.map(k => k.id));
    }
  };


  if (yetkiHatasi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h1 className="text-2xl font-bold">YETKİLENDİRME HATASI</h1>
        <p className="text-slate-400">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
        <button onClick={cikisYap} className="bg-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors">Çıkış Yap</button>
      </div>
    );
  }

  if (!mounted || !zaman) return null;

  if (isAdmin && !adminSecilenKampusId) {
      return (
        <main className="min-h-screen bg-slate-100 font-sans p-4 flex flex-col items-center justify-center relative">
            <Link href="/" className="absolute top-6 left-6 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-600">
                <Home size={24} />
            </Link>
           
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">GÜVENLİK İZLEME MODU</h1>
                    <p className="text-slate-500 font-medium">Lütfen bağlanmak istediğiniz kampüsün güvenlik noktasını seçiniz.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tumKampusler.map((kampus) => (
                        <button 
                            key={kampus.id} 
                            onClick={() => adminKampusSec(kampus)}
                            className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 group text-left hover:-translate-y-1"
                        >
                            <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Building2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{kampus.isim}</h3>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Canlı İzle
                                <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </main>
      );
  }

  // YENİ: 17:00 UYARISI İÇİN MANTIK
  const mesaiBittiMi = zaman.getHours() >= 17;
  const icerideKalanSayisi = ziyaretciler.filter(k => k.durum === 'iceride' && k.ziyaret_tarihi === bugunTarihi).length;

  return (
    <main className="min-h-screen bg-slate-100 font-sans p-4 relative">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center mb-6 sticky top-4 z-40 gap-4 border-b-4 border-emerald-500">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {isAdmin && (
              <button onClick={() => setAdminSecilenKampusId(null)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors text-emerald-400" title="Kampüs Seçimine Dön">
                  <Building2 size={32} />
              </button>
          )}
          {!isAdmin && (
            <Link href="/" className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Home className="text-emerald-500" size={32} />
            </Link>
          )}
          
          <div>
            <h1 className="text-lg font-black uppercase tracking-wide text-white leading-tight">
              {personelKampus ? `${personelKampus.isim} GÜVENLİK` : "YÜKLENİYOR..."}
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <UserCheck size={12} className="text-emerald-400"/> Memur: <span className="text-white font-bold">{personelAdi}</span>
            </p>
          </div>
        </div>
        
        <div className="hidden lg:flex flex-col items-center bg-black/20 px-6 py-1 rounded-lg border border-white/5">
            <div className="text-2xl font-mono font-bold text-white tracking-widest">
                 {zaman.toLocaleTimeString('tr-TR')}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                {zaman.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={verileriGetir} className="bg-blue-600 px-4 py-2 rounded font-bold text-sm flex gap-2 hover:bg-blue-700 transition-colors"><RefreshCw size={16}/> <span className="hidden md:inline">Yenile</span></button>
          <button onClick={cikisYap} className="bg-red-600 px-4 py-2 rounded font-bold text-sm flex gap-2 hover:bg-red-700 transition-colors"><LogOut size={16}/> <span className="hidden md:inline">Çıkış</span></button>
        </div>
      </div>

      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 cursor-pointer select-none">
         <div onClick={() => setDurumFiltresi("hepsi")} className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all hover:scale-[1.02] ${durumFiltresi === 'hepsi' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50' : 'border-slate-200'}`}>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">TOPLAM ZİYARETÇİ</p><p className="text-2xl font-black text-slate-800">{istatistikler.toplam}</p></div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Users size={20}/></div>
         </div>
         <div onClick={() => setDurumFiltresi("iceride")} className={`bg-emerald-50 p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all hover:scale-[1.02] ${durumFiltresi === 'iceride' ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-100/50' : 'border-emerald-100'}`}>
            <div><p className="text-[10px] font-bold text-emerald-600 uppercase">AKTİF MİSAFİR</p><p className="text-2xl font-black text-emerald-700">{istatistikler.iceride}</p></div>
            <div className="bg-white text-emerald-600 p-2 rounded-lg shadow-sm"><Activity size={20} className="animate-pulse"/></div>
         </div>
         <div onClick={() => setDurumFiltresi("onaylandi")} className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all hover:scale-[1.02] ${durumFiltresi === 'onaylandi' ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50' : 'border-slate-200'}`}>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">BEKLEYEN RANDEVU</p><p className="text-2xl font-black text-slate-800">{istatistikler.bekleyen}</p></div>
            <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><Clock size={20}/></div>
         </div>
         <div onClick={() => setDurumFiltresi("cikis_yapti")} className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all hover:scale-[1.02] ${durumFiltresi === 'cikis_yapti' ? 'border-gray-500 ring-2 ring-gray-500/20 bg-gray-50/50' : 'border-slate-200'}`}>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">ÇIKIŞ YAPAN</p><p className="text-2xl font-black text-slate-800">{istatistikler.cikan}</p></div>
            <div className="bg-gray-100 text-gray-500 p-2 rounded-lg"><LogOut size={20}/></div>
         </div>
      </div>

      {/* YENİ: SAAT 17:00 UYARISI */}
      {mesaiBittiMi && icerideKalanSayisi > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
           <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><Clock size={24}/></div>
              <div>
                 <h3 className="text-orange-900 font-bold text-lg">Mesai Saati Tamamlandı (17:00)</h3>
                 <p className="text-orange-700 text-sm font-medium mt-0.5">Sistemde bugün için hala <b>{icerideKalanSayisi} ziyaretçi</b> içeride görünmektedir. Lütfen teyit edip çıkış işlemlerini tamamlayınız.</p>
              </div>
           </div>
           <button onClick={() => { setAktifFiltre("bugun"); setDurumFiltresi("iceride"); }} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap shadow-md">
              İçeridekileri Göster
           </button>
        </div>
      )}

      {/* LİSTE */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto min-h-[500px]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                <button onClick={() => setAktifFiltre("bugun")} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${aktifFiltre === 'bugun' ? 'bg-white text-emerald-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}>BUGÜN</button>
                <button onClick={() => setAktifFiltre("gelecek")} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${aktifFiltre === 'gelecek' ? 'bg-white text-blue-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}>GELECEK</button>
                <button onClick={() => setAktifFiltre("gecmis")} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${aktifFiltre === 'gecmis' ? 'bg-white text-gray-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}>GEÇMİŞ</button>
                <button onClick={() => setAktifFiltre("tumu")} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${aktifFiltre === 'tumu' ? 'bg-white text-purple-600 shadow' : 'text-slate-400 hover:text-slate-600'}`}>TÜMÜ</button>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                {/* YENİ: SEÇİLENLERİ TOPLU ÇIKIŞ YAP BUTONU */}
                {seciliZiyaretciler.length > 0 && (
                   <button onClick={topluCikisYap} className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors animate-in fade-in shadow-md mr-2">
                      <LogOut size={16}/> Çıkış Yap ({seciliZiyaretciler.length})
                   </button>
                )}

                <div className="relative hidden md:block">
                    <ArrowUpDown size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none"/>
                    <select 
                      value={siralama}
                      onChange={(e) => setSiralama(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none hover:bg-slate-100 transition-colors"
                    >
                      <option value="yeniden-eskiye">Tarih (Yeni &gt; Eski)</option>
                      <option value="eskiden-yeniye">Tarih (Eski &gt; Yeni)</option>
                      <option value="a-z">İsim (A - Z)</option>
                      <option value="z-a">İsim (Z - A)</option>
                    </select>
                </div>

                <div className="relative w-full md:w-64">
                    <input type="text" placeholder="Ziyaretçi Ara..." className="w-full p-2.5 pl-10 border border-slate-200 bg-slate-50 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" onChange={(e) => setAramaMetni(e.target.value)}/>
                    <Filter className="absolute left-3 top-3 text-slate-400" size={16}/>
                </div>
            </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
            <tr>
              {/* YENİ: EĞER BUGÜN SEKMESİNDEYSEK TÜMÜNÜ SEÇ KUTUCUĞU ÇIKAR */}
              {aktifFiltre === 'bugun' && (
                <th className="p-3 w-10 text-center rounded-l-lg">
                   <input 
                      type="checkbox" 
                      onChange={handleTumunuSec} 
                      checked={seciliZiyaretciler.length > 0 && seciliZiyaretciler.length === gorunenIceridekiler.length} 
                      disabled={gorunenIceridekiler.length === 0} 
                      className="accent-emerald-600 w-4 h-4 cursor-pointer mt-1"
                      title="Tüm İçeridekileri Seç"
                   />
                </th>
              )}
              <th className={`p-3 w-12 text-center ${aktifFiltre !== 'bugun' ? 'rounded-l-lg' : ''}`}>#</th>
              <th className="p-3">Misafir Bilgisi</th>
              <th className="p-3">Tip / Araç</th>
              <th className="p-3">Randevu Saati</th>
              <th className="p-3">Durum</th>
              <th className="p-3 text-center rounded-r-lg">Operasyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-bold animate-pulse">Veriler Yükleniyor...</td></tr>
            ) : filtrelenmisVeSiralanmisListe.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-bold">Kayıt bulunamadı.</td></tr>
            ) : (
                filtrelenmisVeSiralanmisListe.map((kisi, index) => (
              <tr key={kisi.id} onClick={() => setSecilenZiyaretci(kisi)} className={`cursor-pointer transition-colors group ${seciliZiyaretciler.includes(kisi.id) ? 'bg-emerald-50' : 'hover:bg-emerald-50/50'}`}>
                
                {/* YENİ: CHECKBOX ALANI */}
                {aktifFiltre === 'bugun' && (
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                     {kisi.durum === 'iceride' ? (
                       <input 
                         type="checkbox" 
                         checked={seciliZiyaretciler.includes(kisi.id)} 
                         onChange={() => handleSecim(kisi.id)} 
                         className="accent-emerald-600 w-4 h-4 cursor-pointer mt-1"
                       />
                     ) : (
                       <span className="w-4 h-4 block opacity-20 bg-slate-200 rounded mx-auto mt-1"></span>
                     )}
                  </td>
                )}

                <td className="p-3 text-center font-bold text-slate-400 text-xs">
                  {index + 1}
                </td>
                
                <td className="p-3">
                  <div className="font-black text-slate-800 text-base">{kisi.ziyaretci_ad_soyad}</div>
                  <div className="text-xs text-slate-500 font-mono flex gap-2">
                      <span>TC: {maskeleTC(kisi.ziyaretci_tc)}</span>
                      {kisi.firma_bilgisi && <span className="text-blue-500 font-bold">• {kisi.firma_bilgisi}</span>}
                  </div>
                </td>
                <td className="p-3">
                   <div className="flex flex-col gap-1 items-start">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${kisi.ziyaret_tipi === 'destek' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{kisi.ziyaret_tipi === 'destek' ? 'VIP' : 'Normal'}</span>
                     {kisi.plaka && (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-yellow-200">
                            <Car size={10}/> {kisi.plaka}
                        </span>
                     )}
                   </div>
                </td>
                <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1"><Clock size={14} className="text-slate-400"/> {kisi.ziyaret_saati}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{formatTarih(kisi.ziyaret_tarihi)}</div>
                 </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      kisi.durum === 'iceride' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse' : 
                      kisi.durum === 'cikis_yapti' ? 'bg-gray-100 text-gray-400 border-gray-200 line-through' : 
                      kisi.durum === 'reddedildi' ? 'bg-red-100 text-red-600 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                      {kisi.durum === 'iceride' ? 'İÇERİDE' : kisi.durum === 'cikis_yapti' ? 'ÇIKIŞ YAPTI' : kisi.durum === 'reddedildi' ? 'REDDEDİLDİ' : 'BEKLENİYOR'}
                  </span>
                </td>
                <td className="p-3 flex justify-center gap-2">
                  {kisi.durum === 'onaylandi' && <button onClick={(e) => durumGuncelle(kisi.id, 'iceride', "", e)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all transform active:scale-95">GİRİŞ VER</button>}
                  {kisi.durum === 'iceride' && <button onClick={(e) => durumGuncelle(kisi.id, 'cikis_yapti', "", e)} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all transform active:scale-95">ÇIKIŞ YAP</button>}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* DETAY MODAL */}
      {secilenZiyaretci && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
              <div><h2 className="font-bold text-lg">{secilenZiyaretci.ziyaretci_ad_soyad}</h2><p className="text-xs text-slate-400 font-mono">TC: {maskeleTC(secilenZiyaretci.ziyaretci_tc)}</p></div>
              <button onClick={() => setSecilenZiyaretci(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
               <div className={`p-4 rounded-xl border flex items-center gap-3 ${secilenZiyaretci.durum === 'iceride' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : secilenZiyaretci.durum === 'reddedildi' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  <Activity size={24} />
                  <div>
                      <div className="text-xs font-bold uppercase opacity-70">Anlık Durum</div>
                      <div className="font-black text-lg uppercase">{secilenZiyaretci.durum === 'iceride' ? 'YERLEŞKEDE' : secilenZiyaretci.durum === 'cikis_yapti' ? 'AYRILDI' : secilenZiyaretci.durum === 'reddedildi' ? 'GİRİŞ REDDEDİLDİ' : 'GİRİŞ YAPMADI'}</div>
                  </div>
               </div>
               
               {secilenZiyaretci.durum !== 'onaylandi' && (
                 <div className={`p-3 rounded-xl border flex items-center gap-3 shadow-sm ${
                    secilenZiyaretci.durum === 'reddedildi' ? 'bg-red-50 border-red-200 text-red-800' :
                    secilenZiyaretci.durum === 'iceride' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    'bg-slate-100 border-slate-200 text-slate-800'
                 }`}>
                    <UserCheck size={20} className={secilenZiyaretci.durum === 'reddedildi' ? 'text-red-500' : secilenZiyaretci.durum === 'iceride' ? 'text-emerald-500' : 'text-slate-500'} />
                    <span className="text-sm font-medium">
                       {secilenZiyaretci.durum === 'reddedildi' && <>Bu ziyaretçi <b>{secilenZiyaretci.islem_yapan_guvenlik || "Eski Kayıt (Bilinmiyor)"}</b> tarafından <b>reddedildi</b>.</>}
                       {secilenZiyaretci.durum === 'iceride' && <>Bu ziyaretçi <b>{secilenZiyaretci.islem_yapan_guvenlik || "Eski Kayıt (Bilinmiyor)"}</b> tarafından <b>içeri alındı</b>.</>}
                       {secilenZiyaretci.durum === 'cikis_yapti' && <>Bu ziyaretçinin çıkış işlemi <b>{secilenZiyaretci.islem_yapan_guvenlik || "Eski Kayıt (Bilinmiyor)"}</b> tarafından <b>yapıldı</b>.</>}
                    </span>
                 </div>
               )}

               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b pb-1">Ziyaret Detayları</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><User size={12}/> Personel</div><div className="font-bold text-slate-800">{secilenZiyaretci.ziyaret_edilecek_kisi}</div></div>
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><MapPin size={12}/> Kampüs</div><div className="font-bold text-slate-800 text-sm">{secilenZiyaretci.kampusler ? secilenZiyaretci.kampusler.isim : "Bilinmiyor"}</div></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Calendar size={12}/> Tarih</div><div className="font-bold text-slate-800">{formatTarih(secilenZiyaretci.ziyaret_tarihi)}</div></div>
                   <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Clock size={12}/> Saat</div><div className="font-bold text-slate-800">{secilenZiyaretci.ziyaret_saati}</div></div>
                 </div>
                 <div><div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><FileText size={12}/> Ziyaret Nedeni</div><div className="font-medium text-slate-800 bg-slate-100 p-2 rounded text-sm">{secilenZiyaretci.ziyaret_nedeni}</div></div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Phone size={12}/> GSM</div>
                    <div className="font-bold text-slate-800">{secilenZiyaretci.ziyaretci_gsm || "-"}</div>
                 </div>
               </div>

               {secilenZiyaretci.durum === 'reddedildi' && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm mt-4 animate-in fade-in">
                     <h3 className="text-xs font-black text-red-600 uppercase mb-2 flex items-center gap-1"><ShieldAlert size={14}/> Güvenlik Red Açıklaması</h3>
                     <p className="text-sm font-bold text-slate-700 italic">"{secilenZiyaretci.red_nedeni || "Neden belirtilmemiş."}"</p>
                  </div>
               )}
              
               {(secilenZiyaretci.plaka || secilenZiyaretci.firma_bilgisi) && (
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <h3 className="text-xs font-black text-blue-400 uppercase mb-3 border-b border-blue-100 pb-1">Araç & Firma</h3>
                    <div className="grid grid-cols-2 gap-4">
                       {secilenZiyaretci.plaka && <div><div className="flex items-center gap-1 text-xs text-blue-500 mb-1"><Truck size={12}/> Plaka</div><div className="font-black text-slate-900 font-mono bg-white px-2 py-1 rounded inline-block border border-blue-200">{secilenZiyaretci.plaka}</div></div>}
                       {secilenZiyaretci.firma_bilgisi && <div><div className="flex items-center gap-1 text-xs text-blue-500 mb-1"><Briefcase size={12}/> Firma</div><div className="font-bold text-slate-800">{secilenZiyaretci.firma_bilgisi}</div></div>}
                    </div>
                 </div>
               )}
            </div>

            <div className="bg-white p-4 border-t flex justify-end gap-2">
                 <button onClick={() => setSecilenZiyaretci(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors">Kapat</button>
                 
                 {secilenZiyaretci.durum === 'onaylandi' && (
                   <>
                     <button onClick={() => setShowRedModal(true)} className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors">REDDET</button>
                     <button onClick={() => durumGuncelle(secilenZiyaretci.id, 'iceride')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-emerald-700 transition-colors">GİRİŞ VER</button>
                   </>
                 )}
                 
                 {secilenZiyaretci.durum === 'iceride' && <button onClick={() => durumGuncelle(secilenZiyaretci.id, 'cikis_yapti')} className="bg-slate-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-slate-800 transition-colors">ÇIKIŞ YAP</button>}
            </div>
           </div>
        </div>
      )}

      {/* REDDETME MODALI */}
      {showRedModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4"><div className="bg-red-100 p-2 rounded-full text-red-600"><ShieldAlert size={24}/></div><h3 className="font-bold text-slate-800 text-lg">Giriş Reddi</h3></div>
              <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">Lütfen personelin ekranına yansıyacak olan reddedilme nedenini giriniz.</p>
              <textarea autoFocus rows={3} value={redNedeni} onChange={(e) => setRedNedeni(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 text-sm resize-none" placeholder="Neden belirtiniz..."></textarea>
              <div className="flex gap-3 justify-end">
                  <button onClick={() => { setShowRedModal(false); setRedNedeni(""); }} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">Vazgeç</button>
                  <button onClick={() => { if(redNedeni.trim().length < 3) { alert("Geçerli bir neden giriniz."); return; } durumGuncelle(secilenZiyaretci.id, 'reddedildi', redNedeni); }} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md">Reddet</button>
              </div>
           </div>
        </div>
      )}

    </main>
  );
}