'use client'

import SignOutButton from '@/components/SignOutButton'

export default function YonetimPaneliPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Başlık ve Çıkış Butonu */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              YÖNETİM PANELİ
            </h1>
            <div className="h-1 w-24 bg-blue-600 rounded"></div>
          </div>
          <SignOutButton />
        </div>

        {/* İçerik Alanı */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Hoş Geldiniz
          </h2>
          <p className="text-gray-600">
            Yönetim paneline hoş geldiniz. Bu sayfa yönetim işlemleri için hazırlanmıştır.
          </p>
        </div>
      </div>
    </div>
  )
}
