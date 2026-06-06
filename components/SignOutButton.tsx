'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[signOut] hata:", e);
    } finally {
      router.push("/login"); // hata olsa da kullanıcıyı login'e at
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-red-900/20 hover:shadow-red-900/30 font-semibold flex items-center gap-2 hover:scale-105 active:scale-95"
    >
      <LogOut size={18} />
      <span>Çıkış</span>
    </button>
  )
}