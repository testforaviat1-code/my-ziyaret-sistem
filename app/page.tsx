"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import { 
  LogOut, User, Search, ShieldCheck, 
  Files, X, Globe, ScanFace, ChevronRight,
  Plane, Calendar, CloudSun
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  // MODAL VE MENÜ STATE'LERİ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // AUTH STATE'LERİ
  const [loading, setLoading] = useState(true);
  const [kullanici, setKullanici] = useState<any>(null);
  const [rol, setRol] = useState<string | null>(null);

  // Tarih Bilgisi
  const bugun = new Date();
  const tarihFormat = bugun.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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

  const shortcutList = [
    "SAFETY PORTAL", "SATIŞ VERİ DEPOSU (SDS)", "SERTİFİKALAR", "SÖZLEŞME DASHBOARD",
    "SÖZLEŞMELER PORTALI", "STAR ALLIANCE", "STATION PORTAL", "TEHİR İTİRAZ SİSTEMİ",
    "TEKNOLOJİ PORTAL", "TK WAIVE", "TKSTORE", "TOURİSTANBUL KAPALI GRUP",
    "ÜÇÜNCÜ TARAF KULLANICI", "UÇUŞ AĞIMIZ", "ZED ANLAŞMALARI"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4 font-sans">
        <div className="w-16 h-16 relative">
             <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
             <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* MENÜ KAPATMA KATMANI */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={() => setIsProfileOpen(false)}
        ></div>
      )}

      {/* 1. HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[90px] px-6 md:px-12 flex justify-between items-center border-b border-white/10 backdrop-blur-[2px]">
        <div className="flex items-center gap-4">
           {/* Logo */}
           <img 
             src="/thy_logo.png" 
             alt="THY" 
             className="h-10 w-auto object-contain brightness-0 invert opacity-90" 
             onError={(e) => {e.currentTarget.style.display='none'}} 
           />
           <div className="hidden md:flex flex-col text-white/80">
              <span className="text-sm font-bold tracking-widest leading-none">TURKISH AIRLINES</span>
           </div>
        </div>
        
        {/* Sağ Taraf: Profil */}
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end text-white">
              <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">AKTİF KULLANICI</span>
              <div className="font-bold text-sm">{kullanici?.tam_ad}</div>
           </div>
           <div className="h-8 w-[1px] bg-white/20 hidden md:block"></div>
           
           <div className="relative z-50">
               <button 
                 onClick={() => setIsProfileOpen(!isProfileOpen)} 
                 className={`p-2.5 rounded-full text-white transition-all backdrop-blur-md border border-white/10 ${isProfileOpen ? 'bg-red-600 border-red-500 ring-4 ring-red-900/30' : 'bg-white/10 hover:bg-white/20'}`}
               >
                  <User size={20} />
               </button>

               {isProfileOpen && (
                 <div className="absolute top-full right-0 mt-3 w-56 bg-white shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 border border-slate-100">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kullanıcı Rolü</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${rol === 'admin' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <p className="text-sm font-black text-slate-800 uppercase">{rol}</p>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button onClick={cikisYap} className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                         <LogOut size={16}/> GÜVENLİ ÇIKIŞ
                      </button>
                    </div>
                 </div>
               )}
           </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <div className="relative w-full h-[75vh] bg-red-900 overflow-hidden">
         <img 
            src="/g1.jpeg" 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover object-bottom scale-105 animate-[pulse_20s_ease-in-out_infinite]" 
         />
         
         {/* PUS EFEKTİ YARATAN BÜTÜN GRADIENTLER SİLİNDİ */}

         <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col justify-center pt-32 pb-20">
            
            <div className="max-w-3xl space-y-6 animate-in slide-in-from-left duration-1000">
               <div className="flex items-center gap-3 text-red-400 font-bold tracking-widest uppercase text-xs">
                  <span className="w-8 h-[2px] bg-red-500 shadow-sm"></span>
                  <span className="drop-shadow-md">Operasyon Yönetim Merkezi</span>
               </div>
               
               <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-lg">
                  DÜNYANIN EN ÇOK <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200 drop-shadow-md">ÜLKESİNE UÇUYORUZ.</span>
               </h1>
               
               <p className="text-lg text-white font-medium max-w-xl leading-relaxed drop-shadow-md">
                  Küresel ağımızdaki operasyonel süreçleri tek bir noktadan yönetin, takip edin ve güvenliği sağlayın.
               </p>

               <div className="flex gap-6 pt-4">
                  <div className="flex items-center gap-3 text-white/90 bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md shadow-lg">
                     <Calendar size={18} className="text-red-400"/>
                     <span className="text-xs font-bold uppercase drop-shadow-sm">{tarihFormat}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md shadow-lg">
                     <CloudSun size={18} className="text-yellow-400"/>
                     <span className="text-xs font-bold uppercase drop-shadow-sm">İSTANBUL 18°C</span>
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* 3. KISAYOLLAR & ANA AKSİYON ALANI */}
      <div className="relative z-20 -mt-24 px-6 md:px-12 pb-12">
         <div className="max-w-[1600px] mx-auto">
            
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
               
               {/* SOL: ÖZEL AKSİYON KARTI */}
               <div className="w-full lg:w-1/3 animate-in slide-in-from-bottom duration-1000 delay-200">
                  <div className="h-full bg-white rounded-2xl shadow-2xl shadow-slate-900/10 p-8 border-t-8 border-red-600 relative overflow-hidden group flex flex-col justify-between min-h-[320px]">
                     
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe size={140} />
                     </div>
                     
                     <div>
                       <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">ZİYARETÇİ PORTALI</h3>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">
                         Güvenlik, ziyaretçi kaydı ve saha giriş çıkış işlemleri için yetkili yönetim paneli.
                       </p>
                     </div>
                     
                     <div className="mt-8">
                       <button 
                          onClick={() => setIsModalOpen(true)}
                          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-between px-6 hover:bg-emerald-600 transition-colors group/btn shadow-lg"
                       >
                          İŞLEM YAP
                          <div className="bg-white/20 p-1.5 rounded-full group-hover/btn:translate-x-2 transition-transform">
                             <ChevronRight size={20} />
                          </div>
                       </button>
                     </div>

                  </div>
               </div>

               {/* SAĞ: KISAYOL LİSTESİ */}
               <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border-t-8 border-slate-200 p-8 animate-in slide-in-from-bottom duration-1000 delay-300 flex flex-col">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                     <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">KURUMSAL KISAYOLLAR</h2>
                     <Search size={18} className="text-slate-300"/>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                     {shortcutList.map((text, idx) => (
                        <a key={idx} href="#" className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-red-500 transition-colors"></div>
                           <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                              {text}
                           </span>
                        </a>
                     ))}
                  </div>
               </div>

            </div>
         </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center pb-8 pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
         © 2026 TURKISH AIRLINES TECHNOLOGY
      </footer>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-red-500" size={28} />
                <div>
                   <h3 className="text-white font-bold text-lg leading-none">GÜVENLİK MERKEZİ</h3>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Erişim Yönetim Paneli</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 grid gap-4">
              
              <Link href="/ziyaretci-formu" className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all rounded-xl group">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><ScanFace size={24} /></div>
                <div><h4 className="font-bold text-slate-800 text-sm">Ziyaretçi Talebi Oluştur</h4><p className="text-xs text-slate-500 mt-1">Yeni misafir kaydı</p></div>
                <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-600" size={20}/>
              </Link>

              {(rol === 'guvenlik' || rol === 'admin') && (
                <Link href="/guvenlik-panel" className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1 transition-all rounded-xl group">
                    <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><ShieldCheck size={24} /></div>
                    <div><h4 className="font-bold text-slate-800 text-sm">Güvenlik Personel Ekranı</h4><p className="text-xs text-slate-500 mt-1">Giriş/Çıkış kontrolleri</p></div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-emerald-600" size={20}/>
                </Link>
              )}
              
              {rol === 'admin' && (
                <Link href="/idari-panel" className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-800 hover:-translate-y-1 transition-all rounded-xl group">
                    <div className="bg-slate-100 p-3 rounded-full text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors"><Files size={24} /></div>
                    <div><h4 className="font-bold text-slate-800 text-sm">İdari Yönetim Paneli</h4><p className="text-xs text-slate-500 mt-1">Raporlar ve ayarlar</p></div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-slate-800" size={20}/>
                 </Link>
              )}

            </div>
          </div>
        </div>
      )}
    </main>
  );
}