"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Lock, ArrowRight, Eye, EyeOff, 
  CreditCard, ShieldAlert
} from "lucide-react";

export default function GuvenlikGiris() {
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

    const supabase = createClient();

    try {
      // 1. Sicil no sonuna otomatik @thy.com ekleme
      const emailToSubmit = email.includes("@") ? email : `${email}@thy.com`;

      // 2. Giriş Yap
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToSubmit,
        password,
      });

      if (authError || !user) throw new Error("Sicil no veya şifre hatalı."); 

      // 3. YETKİ KONTROLÜ
      const { data: profil, error: profilError } = await supabase
        .from('profiller')
        .select('rol, kampus_id') 
        .eq('id', user.id)
        .single();

      if (profilError || !profil) {
         await supabase.auth.signOut();
         throw new Error("Profil bilgisi bulunamadı."); 
      }

      // Çerezlerin anında algılanması için
      router.refresh();

      // 4. HERKESİ ANA PORTALA (UÇAKLI EKRANA) YÖNLENDİR
      router.push("/");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <main className="min-h-screen relative flex font-sans overflow-hidden bg-[#0a0000]">
      
      {/* --- 1. FULL EKRAN ARKAPLAN --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-br from-[#3b0000] via-[#0a0000] to-[#000000]"></div>
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(220,38,38,0.2),_transparent_60%)]"></div>
         
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[800px] opacity-40">
           <svg viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M-100 450 C 300 350, 600 650, 1500 250" stroke="url(#redGrad)" strokeWidth="4" opacity="0.8" />
              <path d="M-100 500 C 400 450, 700 750, 1500 300" stroke="url(#redGrad)" strokeWidth="2" opacity="0.5" />
              <path d="M-100 550 C 500 550, 800 850, 1500 350" stroke="url(#redGrad)" strokeWidth="0.5" opacity="0.3" />
              <defs>
                 <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="50%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                 </linearGradient>
              </defs>
           </svg>
         </div>
      </div>

      {/* --- 2. SOL TARAF BRANDING --- */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center p-16 pl-24">
        <div className="max-w-lg w-full">
           
           <div className="mb-8 animate-in slide-in-from-left duration-700">
              <h1 className="text-4xl font-black tracking-widest uppercase text-white mb-2">THY SECURITY</h1>
              <div className="flex items-center gap-3">
                 <div className="w-12 h-0.5 bg-red-600"></div>
                 <p className="text-xs text-red-600 font-mono tracking-[0.3em] uppercase">ACCESS CONTROL V2.1</p>
              </div>
           </div>
      
           <h2 className="text-[3.25rem] font-bold leading-tight mb-2 text-white animate-in slide-in-from-bottom duration-1000 delay-100">
             Güvenli Erişim
           </h2>
           <h2 className="text-[3.25rem] font-light italic leading-tight mb-8 text-red-600 animate-in slide-in-from-bottom duration-1000 delay-200">
             Tek Noktada.
           </h2>

           <p className="text-slate-300 text-sm leading-relaxed mb-8 animate-in slide-in-from-bottom duration-1000 delay-300">
             Ziyaretçi yönetim sistemi, saha operasyonları ve idari denetim mekanizması artık tek bir panel üzerinden yönetilmektedir.
           </p>

        </div>
      </div>

      {/* --- 3. SAĞ TARAF FORM --- */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
         
         <div className="max-w-[420px] w-full bg-[#160606]/80 backdrop-blur-2xl border border-red-500/10 p-10 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-right duration-700">
            
            <div className="text-center mb-10">
               <h2 className="text-xl font-black text-white tracking-wide mb-1">THY ZİYARET PORTALI</h2>
               <p className="text-sm text-slate-400">Kurumsal Giriş Ekranı</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 rounded-xl shadow-lg text-sm flex items-center gap-3 animate-in shake">
                <ShieldAlert size={20} className="shrink-0"/> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
               
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">PERSONEL SİCİL NO</label>
                  <div className="relative group">
                     <CreditCard className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                     <input 
                       type="text" 
                       value={email}
                       onChange={(e) => {
                           if (/^\d*$/.test(e.target.value)) setEmail(e.target.value);
                       }}
                       className="w-full pl-12 pr-4 py-3.5 bg-[#0f0404]/60 border border-white/5 rounded-xl text-white font-bold focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all placeholder:text-slate-700"
                       placeholder="" 
                       required
                       autoComplete="off"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">ŞİFRE</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                     <input 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-12 pr-12 py-3.5 bg-[#0f0404]/60 border border-white/5 rounded-xl text-white font-bold focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 outline-none transition-all placeholder:text-slate-700 tracking-widest"
                       placeholder="••••••••"
                       required
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-3.5 text-slate-500 hover:text-red-400 transition-colors"
                     >
                       {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-[#cc0000] hover:bg-[#aa0000] text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-red-900/40 transform active:scale-95 transition-all flex items-center justify-center gap-2 group mt-2"
               >
                 {loading ? (
                   "Bağlanıyor..."
                 ) : (
                   <>
                     Giriş Yap <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                   </>
                 )}
               </button>

            </form>

            <div className="mt-10 pt-6 text-center opacity-60">
               <p className="text-[9px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                 © 2026 THY Teknik A.Ş.<br/>
                 Güvenlik Direktörlüğü & Bilgi Teknolojileri
               </p>
            </div>

         </div>
      </div>

    </main>
  );
}