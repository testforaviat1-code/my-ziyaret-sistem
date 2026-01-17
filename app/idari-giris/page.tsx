"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, 
  LayoutDashboard, CloudSun 
} from "lucide-react";

export default function IdariGiris() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) throw new Error("E-posta veya şifre hatalı.");

      // GÜVENLİKÇİ KONTROLÜ
      const { data: guvenlikKaydi } = await supabase
        .from('personel_profilleri')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (guvenlikKaydi) {
        await supabase.auth.signOut(); 
        throw new Error("Erişim Reddedildi: Bu panel sadece İdari Personel içindir.");
      }

      router.push("/idari-panel");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex font-sans overflow-hidden">
      
      {/* --- 1. FULL EKRAN ARKAPLAN (GÖRSEL + PERDE) --- */}
      <div className="absolute inset-0 z-0">
         <img 
           src="/thy_gok.jpg" 
           alt="THY Global Arkaplan" 
           className="w-full h-full object-cover scale-105 animate-in fade-in duration-[2000ms]" 
         />
         {/* Koyu Perde: Sol taraf daha koyu, sağ taraf biraz daha şeffaf olsun ki form okunsun */}
         <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/60"></div>
      </div>

      {/* --- 2. SOL TARAF (İÇERİK) --- */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-lg w-full">
           
           {/* LOGO */}
           <div className="flex items-center gap-4 mb-8 animate-in slide-in-from-left duration-700">
              <img src="/thy logo.png" alt="THY Logo" className="h-16 w-auto object-contain drop-shadow-2xl filter brightness-100 invert-0"/>
              <div className="h-12 w-[1px] bg-white/30"></div> 
              <h1 className="text-3xl font-black tracking-tighter uppercase text-white drop-shadow-md">
                THY Global
              </h1>
           </div>
           
           <h2 className="text-5xl font-bold leading-tight mb-6 text-white animate-in slide-in-from-bottom duration-1000 delay-100 drop-shadow-lg">
             Yönetim & <br/> <span className="text-red-500">Operasyon</span> Merkezi
           </h2>
           
           <p className="text-slate-200 text-lg leading-relaxed mb-8 animate-in slide-in-from-bottom duration-1000 delay-200 font-medium drop-shadow-md">
             Tüm yerleşkelerin ziyaretçi trafiğini, güvenlik protokollerini ve personel performansını tek merkezden yönetin.
           </p>

           {/* WIDGET */}
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center justify-between animate-in zoom-in duration-1000 delay-300 shadow-2xl">
              <div className="flex items-center gap-3">
                 <CloudSun className="text-yellow-400" size={28}/>
                 <div>
                    <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">İstanbul HQ</div>
                    <div className="text-2xl font-bold text-white">14°C</div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">Sistem Durumu</div>
                 <div className="text-emerald-400 font-bold flex items-center gap-2 justify-end mt-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Aktif
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- 3. SAĞ TARAF (GLASS FORM) --- */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
         
         {/* GLASS CARD CONTAINER */}
         <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right duration-700">
            
            <div className="text-center mb-8">
               <div className="inline-block p-4 rounded-full bg-white/20 mb-4 text-white shadow-inner border border-white/10">
                  <LayoutDashboard size={32} />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Yönetici Girişi</h2>
               <p className="text-slate-200 mt-2 font-medium text-sm">Kurumsal kimlik bilgilerinizle oturum açın.</p>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white p-4 mb-6 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in shake">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase ml-1">Kurumsal E-Posta</label>
                  <div className="relative group">
                     <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                     {/* INPUT: Yarı saydam beyaz arka plan */}
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full pl-12 pr-4 py-3 bg-white/90 border border-transparent rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-red-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                       placeholder="ad.soyad@thy.com"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase ml-1">Şifre</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                     <input 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-12 pr-12 py-3 bg-white/90 border border-transparent rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-red-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                       placeholder="••••••••"
                       required
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-3.5 text-slate-500 hover:text-red-600 transition-colors"
                     >
                       {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
                  <div className="text-right">
                     <a href="#" className="text-xs font-bold text-slate-300 hover:text-white transition-colors hover:underline">Şifremi Unuttum?</a>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-900/50 transform active:scale-95 transition-all flex items-center justify-center gap-2 group border border-red-500"
               >
                 {loading ? (
                   "Kontrol Ediliyor..."
                 ) : (
                   <>
                     Panele Gir <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                   </>
                 )}
               </button>

            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
               <p className="text-xs text-slate-300 font-medium">
                 © 2026 THY Global Teknoloji A.Ş. <br/> 
                 Güvenlik Personeli Girişi için <a href="/guvenlik-giris" className="text-white font-bold hover:underline hover:text-red-400 transition-colors">tıklayınız.</a>
               </p>
            </div>

         </div>
      </div>

    </main>
  );
}