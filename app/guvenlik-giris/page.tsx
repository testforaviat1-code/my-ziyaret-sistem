"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, 
  ShieldCheck, Activity 
} from "lucide-react";

export default function GuvenlikGiris() {
  const supabase = createClient();
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
      // 1. Giriş Yap
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) throw new Error("Sicil no (E-posta) veya şifre hatalı.");

      // 2. YETKİ KONTROLÜ (GÜNCELLENDİ: 'profiller' TABLOSU)
      // Artık 'personel_profilleri' değil 'profiller' tablosuna bakıyoruz.
      const { data: profil, error: profilError } = await supabase
        .from('profiller')
        .select('rol, kampus_id')
        .eq('id', user.id)
        .single();

      if (profilError || !profil) {
         await supabase.auth.signOut();
         throw new Error("Profil bilgisi bulunamadı.");
      }

      // Yetki Kontrolü: Sadece Güvenlik ve Admin girebilir
      if (profil.rol !== 'guvenlik' && profil.rol !== 'admin') {
        await supabase.auth.signOut();
        throw new Error("Erişim Reddedildi: Bu panele giriş yetkiniz yok.");
      }

      // 3. Giriş Başarılı -> Panele Yönlendir
      // Admin ise oradaki seçiciye, güvenlik ise kendi ekranına düşecek.
      router.push("/guvenlik-panel");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex font-sans overflow-hidden bg-slate-900">
      
      {/* --- 1. FULL EKRAN ARKAPLAN (UÇAK & PERDE) --- */}
      <div className="absolute inset-0 z-0">
         {/* Görsel ismini projedeki görseline göre ayarla, örn: /ucak1.avif veya /thyuc.jpg */}
         <img 
           src="/ucak1.avif" 
           alt="TSS Operasyon" 
           className="w-full h-full object-cover scale-105 animate-in fade-in duration-[2000ms]" 
           onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop")} // Yedek görsel
         />
         {/* Koyu Lacivert Filtre */}
         <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-900/60"></div>
      </div>

      {/* --- 2. SOL TARAF (SLOGAN & BRANDING) --- */}
      <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-lg w-full">
           
           {/* ÜST BAŞLIK */}
           <div className="flex items-center gap-3 mb-8 animate-in slide-in-from-left duration-700">
              <div className="bg-emerald-500/20 border border-emerald-500/50 p-2 rounded-lg text-emerald-400">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-widest uppercase text-white">TSS SECURITY</h1>
                <p className="text-[10px] text-emerald-400 font-mono tracking-[0.2em] uppercase">Turkish Support Services</p>
              </div>
           </div>
           
           {/* ANA SLOGAN */}
           <h2 className="text-5xl font-black leading-tight mb-6 text-white animate-in slide-in-from-bottom duration-1000 delay-100 drop-shadow-2xl">
             OPERASYON <br/> 
             <span className="text-emerald-500">7/24 AKTİF</span> <br/>
             İZLEME
           </h2>
           
           <div className="w-20 h-2 bg-emerald-500 mb-8 rounded-full animate-in zoom-in duration-1000 delay-200"></div>

           <p className="text-slate-300 text-lg leading-relaxed mb-8 animate-in slide-in-from-bottom duration-1000 delay-300 font-medium">
             Tüm yerleşkelerin güvenlik protokolleri, ziyaretçi giriş-çıkışları ve acil durum yönetimi tek ekranda.
           </p>

        </div>
      </div>

      {/* --- 3. SAĞ TARAF (CAM FORM) --- */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
         
         {/* GLASS CARD */}
         <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right duration-700">
            
            <div className="text-center mb-8">
               <div className="inline-block p-4 rounded-full bg-emerald-500/10 mb-4 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/20">
                  <Activity size={32} />
               </div>
               <h2 className="text-2xl font-black text-white tracking-tight">Güvenlik Girişi</h2>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white p-4 mb-6 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in shake">
                <span>🚫</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Personel E-Posta</label>
                  <div className="relative group">
                     <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                       placeholder="ad.soyad@thy.com"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Şifre</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                     <input 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-12 pr-12 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                       placeholder="••••••••"
                       required
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-3.5 text-slate-500 hover:text-emerald-400 transition-colors"
                     >
                       {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/50 transform active:scale-95 transition-all flex items-center justify-center gap-2 group border border-emerald-500/50 mt-4"
               >
                 {loading ? (
                   "Bağlanıyor..."
                 ) : (
                   <>
                     Giriş <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                   </>
                 )}
               </button>

            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
               <p className="text-xs text-slate-500 font-medium">
                 © 2026 TSS Teknoloji A.Ş.
               </p>
            </div>

         </div>
      </div>

    </main>
  );
}