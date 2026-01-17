import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white text-center p-4">
      <h1 className="text-9xl font-black text-slate-800">404</h1>
      <h2 className="text-2xl font-bold mb-4">Sayfa Bulunamadı</h2>
      <p className="text-slate-400 mb-8">Aradığınız uçuş rotası sistemimizde mevcut değil.</p>
      <Link href="/" className="bg-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}