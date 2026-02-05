"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import { 
  Phone, Utensils, Users, Smartphone, Heart, Compass, Sun, 
  FileText, Files, Gavel, GraduationCap, Lightbulb, Award, 
  Ticket, Target, HeartPulse, Plane, Globe, X, ScanFace, 
  ShieldCheck, LogOut, Loader2, ChevronRight, Search, Menu, Bell, User
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- MEKANİK STATE'LER (Auth & Rol) ---
  const [loading, setLoading] = useState(true);
  const [kullanici, setKullanici] = useState<any>(null);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    async function kontrolEt() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profil } = await supabase
        .from('profiller')
        .select('rol, tam_ad')
        .eq('id', session.user.id)
        .single();

      if (profil) {
        setKullanici(profil);
        setRol(profil.rol);
      }
      setLoading(false);
    }
    kontrolEt();
  }, [router]);

  const cikisYap = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- İKON MENÜ LİSTESİ (Koyu Gri Alan) ---
  const iconMenu = [
    { icon: Phone, label: "TELEFON REHBERİ" },
    { icon: Utensils, label: "GÜNÜN YEMEĞİ" },
    { icon: Users, label: "ÇALIŞAN PORTALI (TEMPO)" },
    { icon: Smartphone, label: "TK STORE" },
    { icon: Heart, label: "EMPATHY" },
    { icon: Compass, label: "TURUNCU HAT v2.0" },
    { icon: Sun, label: "SOSYAL HİZMETLER" },
    { icon: FileText, label: "EBYS" },
    { icon: Files, label: "DDMS" },
    { icon: Gavel, label: "İKTS" },
    { icon: GraduationCap, label: "LMS" },
    { icon: Lightbulb, label: "IDEAPORT" },
    { icon: Award, label: "KARİYER" },
    { icon: Ticket, label: "MYPASS" },
    { icon: Target, label: "2033 STRATEJİLERİMİZ" },
    { icon: HeartPulse, label: "SAĞLIK" },
    { icon: Globe, label: "ZED" },
    { icon: Compass, label: "ETİK BİLDİRİM" },
    { icon: ShieldCheck, label: "AQD PORTAL" },
    { icon: Plane, label: "BRAND CENTER" },
    { icon: Users, label: "QUALITEAM" },
  ];

  // --- KISAYOLLAR LİSTESİ (Beyaz Alan - Pasifler) ---
  const shortcutList = [
    "SAFETY PORTAL", "SATIŞ VERİ DEPOSU (SDS)", "SERTİFİKALAR", "SÖZLEŞME DASHBOARD",
    "SÖZLEŞMELER PORTALI", "STAR ALLIANCE", "STATION PORTAL", "TEHİR İTİRAZ SİSTEMİ",
    "TEKNOLOJİ PORTAL", "TK WAIVE", "TKSTORE", "TOURİSTANBUL KAPALI GRUP",
    "ÜÇÜNCÜ TARAF KULLANICI", "UÇUŞ AĞIMIZ", "ZED ANLAŞMALARI"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800 gap-4 font-sans">
        <div className="w-16 h-16 relative">
             <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
             <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-xs font-bold animate-pulse tracking-widest uppercase text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* 1. HEADER (Beyaz Üst Bar) */}
      <header className="bg-white h-[80px] px-4 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
             <img src="/thy_logo.png" alt="THY" className="h-10 w-auto object-contain" onError={(e) => {e.currentTarget.style.display='none'}} /> 
             {/* Logo yüklenmezse yedek ikon */}
             <div className="flex items-center gap-2" style={{display: 'none'}}> 
                <div className="bg-red-600 rounded-full p-2 text-white"><Plane size={20} fill="currentColor"/></div>
                <span className="font-bold text-slate-800">TURKISH AIRLINES</span>
             </div>
          </div>
          
          {/* Nav Linkleri */}
          <nav className="hidden xl:flex gap-6 text-[13px] font-bold text-slate-500 tracking-wide h-full items-center">
            <span className="text-slate-800 border-b-4 border-red-600 h-[80px] flex items-center px-2 cursor-pointer">ANASAYFA</span>
            <span className="hover:text-red-600 transition-colors cursor-default h-[80px] flex items-center px-2">KURUMSAL</span>
            <span className="hover:text-red-600 transition-colors cursor-default h-[80px] flex items-center px-2">ÇALIŞAN DESTEK</span>
            <span className="hover:text-red-600 transition-colors cursor-default h-[80px] flex items-center px-2">İLETİŞİM</span>
          </nav>
        </div>
        
        {/* Sağ Taraf: Profil */}
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">TÜRK HAVA YOLLARI'NDA BUGÜN</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                 <Plane size={16} className="text-slate-400" /> 428 <span className="text-xs font-normal text-slate-500">HAVADAKİ UÇAK</span>
              </div>
           </div>
           <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
           <div className="flex items-center gap-3 cursor-pointer group relative">
               <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-800 uppercase group-hover:text-red-600 transition-colors">{kullanici?.tam_ad}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{rol === 'admin' ? 'YÖNETİCİ' : rol === 'guvenlik' ? 'GÜVENLİK' : 'PERSONEL'}</div>
               </div>
               <div className="bg-slate-100 p-2 rounded-full text-slate-600 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  <User size={20} />
               </div>
               
               {/* Dropdown Çıkış */}
               <div className="absolute top-full right-0 mt-2 w-32 bg-white shadow-xl rounded-lg border border-slate-100 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                  <button onClick={cikisYap} className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                     <LogOut size={14}/> ÇIKIŞ YAP
                  </button>
               </div>
           </div>
        </div>
      </header>

      {/* 2. HERO BANNER (Gök Görseli) */}
      <div className="relative w-full h-[350px] bg-slate-800 overflow-hidden group">
         <img src="/thy_gok.jpg" alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[3s]" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#2b303b] to-transparent"></div>
         <div className="absolute bottom-10 left-4 md:left-12 text-white max-w-2xl">
            <div className="bg-red-600 w-fit px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">Duyuru</div>
            <h1 className="text-4xl font-light tracking-tight mb-2">ÖZEL SAĞLIK SİGORTAMIZ <br/> <span className="font-bold">YENİLENDİ</span></h1>
            <p className="text-sm text-slate-300 opacity-90">01.01.2026 tarihinden itibaren geçerli olan yeni poliçe detaylarına buradan ulaşabilirsiniz.</p>
         </div>
      </div>

      {/* 3. KOYU GRID MENÜ (Pasif İkonlar) */}
      <div className="bg-[#2b303b] text-white py-12 px-4 md:px-12">
         <div className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-px bg-white/10 border border-white/10">
            {iconMenu.map((item, idx) => (
               <div key={idx} className="aspect-square bg-[#2b303b] hover:bg-[#353b48] transition-colors flex flex-col items-center justify-center gap-4 cursor-default group border border-white/5 p-4 text-center">
                  <item.icon size={32} className="text-slate-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider leading-tight px-2">{item.label}</span>
               </div>
            ))}
         </div>
      </div>

      {/* 4. KISAYOLLAR LİSTESİ (Beyaz Alan) */}
      <div className="bg-white py-12 px-4 md:px-12 border-t border-slate-200">
         <div className="max-w-[1600px] mx-auto">
            {/* Başlık */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
               <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">KISAYOLLAR</h2>
               <Search className="text-slate-400" size={20} />
            </div>

            {/* Liste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
               {/* Pasif Linkler */}
               {shortcutList.map((text, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-4 border-b border-slate-100 text-xs font-bold text-slate-500 hover:text-slate-800 hover:pl-2 transition-all cursor-default">
                     <span className="text-red-600 font-black text-sm">&gt;</span>
                     {text}
                  </div>
               ))}

               {/* --- AKTİF BUTON (SAĞ ALTTAKİ BOŞLUK İÇİN) --- */}
               <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 py-4 border-b border-red-100 bg-red-50 text-xs font-black text-red-700 hover:bg-red-600 hover:text-white hover:pl-4 transition-all cursor-pointer group shadow-sm animate-in slide-in-from-bottom-2 mt-4 md:mt-0"
               >
                   <span className="text-red-600 font-black text-sm group-hover:text-white transition-colors">&gt;</span>
                   ZİYARETÇİ VE GÜVENLİK İŞLEMLERİ
                   <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><ScanFace size={16}/></span>
               </button>
            </div>
         </div>
      </div>

      {/* 5. FOOTER */}
      <footer className="bg-[#f4f4f4] py-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
         © 2026 TÜRK HAVA YOLLARI A.O. | BİLGİ TEKNOLOJİLERİ
      </footer>

      {/* 6. MODAL (Sistemin Açıldığı Yer) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
            <div className="bg-[#232b38] p-5 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Globe className="text-red-600" size={24} />
                <h3 className="text-white font-bold text-lg tracking-wide">ZİYARETÇİ İŞLEM MERKEZİ</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 bg-slate-50 grid gap-4">
              
              {/* Ziyaretçi Formu - Herkes */}
              <Link href="/ziyaretci-formu" className="flex items-center gap-4 p-4 bg-white border-l-4 border-blue-600 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
                <div><h4 className="font-bold text-slate-800">Talep Oluştur</h4><p className="text-xs text-slate-500 mt-1">Dışarıdan gelecek misafir kaydı</p></div>
              </Link>

              {/* Güvenlik Paneli - Yetkililer */}
              {(rol === 'guvenlik' || rol === 'admin') && (
                <Link href="/guvenlik-panel" className="flex items-center gap-4 p-4 bg-white border-l-4 border-emerald-600 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><ShieldCheck size={24} /></div>
                    <div><h4 className="font-bold text-slate-800">Güvenlik Paneli</h4><p className="text-xs text-slate-500 mt-1">Saha giriş/çıkış kontrolü</p></div>
                </Link>
              )}
              
              {/* İdari Panel - Admin */}
              {rol === 'admin' && (
                <Link href="/idari-panel" className="flex items-center gap-4 p-4 bg-white border-l-4 border-slate-800 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                    <div className="bg-slate-100 p-3 rounded-lg text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors"><Files size={24} /></div>
                    <div><h4 className="font-bold text-slate-800">İdari Yönetim Paneli</h4><p className="text-xs text-slate-500 mt-1">Tüm sistem raporları ve ayarlar</p></div>
                </Link>
              )}

            </div>
            <div className="bg-slate-100 p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200">
              Güvenli Erişim Protokolü v2.5
            </div>
          </div>
        </div>
      )}
    </main>
  );
}