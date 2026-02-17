"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, 
  AlertCircle 
} from "lucide-react";

export default function LoginPage() {
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

      if (authError || !user) throw new Error("E-posta adresiniz veya şifreniz hatalı.");

      const { data: profil, error: profilError } = await supabase
        .from('profiller')
        .select('rol')
        .eq('id', user.id)
        .single();

      if (profilError || !profil) {
        await supabase.auth.signOut();
        throw new Error("Kullanıcı profiliniz sistemde bulunamadı.");
      }

      router.push("/"); 

    } catch (err: any) {
      console.error("Login Hatası:", err);
      setError(err.message || "Beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex font-sans overflow-hidden bg-slate-900">
      
      {/* 1. ARKAPLAN (UÇAK TEMASI) */}
      <div className="absolute inset-0 z-0">
         <img 
           src="/thy_gok.jpg" 
           alt="THY Background" 
           className="w-full h-full object-cover opacity-60" 
         />
         <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/60"></div>
      </div>

      {/* 2. SOL TARAF (SADECE YAZI) */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-lg w-full space-y-8">
           <div className="animate-in slide-in-from-left duration-700">
              <h1 className="text-4xl font-black tracking-widest uppercase text-white leading-none drop-shadow-2xl">
                THY SECURITY
              </h1>
              <div className="flex items-center gap-3 mt-3">
                 <div className="h-[2px] w-12 bg-red-600"></div>
                 <p className="text-xs text-slate-300 font-mono tracking-[0.4em] uppercase">Access Control v2.1</p>
              </div>
           </div>
           
           <div className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-100">
             <h2 className="text-5xl font-bold leading-tight text-white drop-shadow-lg">
               Güvenli Erişim <br/> 
               <span className="text-red-500 font-light italic">Tek Noktada.</span>
             </h2>
             <p className="text-slate-400 text-lg leading-relaxed font-medium">
               Ziyaretçi yönetim sistemi, saha operasyonları ve idari denetim mekanizması artık tek bir panel üzerinden yönetilmektedir.
             </p>
           </div>
        </div>
      </div>

      {/* 3. SAĞ TARAF (FORM KARTI) */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
         <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-700">
            <div className="text-center mb-10">
               {/* LOGO BURADAN SİLİNDİ */}
               <h2 className="text-2xl font-black text-white tracking-tight">THY ZİYARET PORTALI</h2>
               <p className="text-slate-400 mt-2 text-sm font-medium">Kurumsal Giriş Ekranı</p>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white p-4 mb-6 rounded-xl shadow-lg text-sm font-bold flex items-start gap-3 animate-in shake">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Kurumsal E-Posta</label>
                  <div className="relative group">
                     <Mail className="absolute left-4 top-4 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all placeholder:text-slate-600"
                       placeholder="ad.soyad@thy.com"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Şifre</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-4 text-slate-500 group-focus-within:text-white transition-colors" size={20} />
                     <input 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all placeholder:text-slate-600"
                       placeholder="••••••••"
                       required
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                     >
                       {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-red-900/50 transform active:scale-95 transition-all flex items-center justify-center gap-2 group border border-red-500/50 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {loading ? (
                   <span className="flex items-center gap-2">
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     Doğrulanıyor...
                   </span>
                 ) : (
                   <>
                     Giriş Yap <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                   </>
                 )}
               </button>
            </form>

            <div className="mt-10 pt-6 border-t border-white/5 text-center">
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 © 2026 THY Teknik A.Ş. <br/> 
                 <span className="opacity-50">Güvenlik Direktörlüğü & Bilgi Teknolojileri</span>
               </p>
            </div>
         </div>
      </div>
    </main>
  );
}