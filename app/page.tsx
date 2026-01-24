import { Wrench, Warehouse, Plane, Settings, AlertTriangle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      
      {/* 1. ARKAPLAN GÖRSELİ & KARARTMA */}
      <div className="absolute inset-0 z-0">
         {/* Senin istediğin gökyüzü görseli */}
         <img 
           src="/thy_gok.jpg" 
           alt="THY Maintenance Background" 
           className="w-full h-full object-cover opacity-40 scale-105 animate-in fade-in duration-[2000ms]" 
         />
         {/* Üzerine koyu gradient atıyoruz ki yazılar okunsun */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/95 to-slate-950/90"></div>
         {/* Hafif bir doku ekleyelim teknolojik dursun */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      {/* 2. BAKIM KARTI İÇERİĞİ */}
      <div className="relative z-10 max-w-3xl w-full p-4 mx-4 animate-in slide-in-from-bottom duration-700">
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
            
            {/* Üstteki Kırmızı Uyarı Şeridi */}
            <div className="absolute top-0 left-0 w-full bg-red-600/80 h-2"></div>
            
            {/* İkonlar Grubu */}
            <div className="flex justify-center items-end gap-4 mb-10 text-slate-400 opacity-90">
               <Settings size={48} className="animate-[spin_10s_linear_infinite] text-red-600" />
               <Warehouse size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" strokeWidth={1.5} />
               <Wrench size={48} className="text-red-600 -scale-x-100" />
            </div>

            {/* Ana Başlıklar */}
            <div className="space-y-6">
               <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                  <AlertTriangle size={14} /> Sistem Çevrimdışı
               </div>
               
               <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">
                  PLANLI BAKIM VE <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">HANGAR ENTEGRASYONU</span>
               </h1>
               
               <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
                  THY Güvenlik ve Erişim Sistemleri, kritik altyapı modernizasyonu ve hangar veri tabanı güncelleme süreçleri nedeniyle geçici olarak hizmet verememektedir.
               </p>
            </div>

            {/* Alt Bilgi */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4 text-xs text-slate-500 font-mono uppercase tracking-widest">
               <Plane size={20} className="text-red-600 -rotate-90 opacity-50 animate-bounce" />
               <p>
                 THY Teknik A.Ş. // Bilgi Teknolojileri & Operasyon Direktörlüğü
               </p>
            </div>

         </div>
      </div>
    </main>
  );
}