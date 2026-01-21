'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [idKod, setIdKod] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const girisYap = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)

    // 1. ID Kodu'nu E-Posta formatına çevir (Arka Planda)
    // Örnek: Kullanıcı '100001' girerse, sistem '100001@myinfotr.com' dener.
    const email = `${idKod}@myinfotr.com`

    // 2. Supabase ile Giriş Yap
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    })

    if (error) {
      setHata('Hatalı ID veya Şifre! Lütfen tekrar deneyin.')
      setYukleniyor(false)
      return
    }

    // 3. Giriş Başarılı ise ROLÜ ÖĞRENMEK için veritabanına bak
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Profiles tablosundan bu kullanıcının rolünü çek
      const { data: profil } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      // 4. Role Göre Yönlendir
      if (profil?.rol === 'guvenlik') {
        router.push('/guvenlik-paneli') // Güvenlik personelini kendi sayfasına at
      } else if (profil?.rol === 'admin') {
        router.push('/yonetim-paneli') // Yöneticiyi admin sayfasına at
      } else {
        router.push('/') // Standart personeli talep sayfasına at
      }
    }
    
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">MyInfoTR Giriş</h2>
        
        <form onSubmit={girisYap} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Personel / Güvenlik ID</label>
            <input
              type="text"
              placeholder="Örn: 100001"
              value={idKod}
              onChange={(e) => setIdKod(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              placeholder="******"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
              required
            />
          </div>

          {hata && <div className="text-red-500 text-sm text-center font-bold">{hata}</div>}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
          >
            {yukleniyor ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
