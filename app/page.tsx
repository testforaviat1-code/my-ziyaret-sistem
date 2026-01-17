"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Phone, Utensils, Users, Smartphone, Heart, Compass, Sun, 
  FileText, Files, Gavel, GraduationCap, Lightbulb, Award, 
  Ticket, Target, HeartPulse, Plane, Globe, X, ScanFace, Star, ShieldCheck
} from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pasif kutucuklar
  const passiveItems = [
    { icon: Phone, label: "TELEFON REHBERİ" },
    { icon: Utensils, label: "GÜNÜN YEMEĞİ" },
    { icon: Users, label: "ÇALIŞAN PORTALI (TEMPO)" },
    { icon: Smartphone, label: "TK STORE" },
    { icon: Heart, label: "EMPATHY" },
    { icon: Compass, label: "TURUNCU HAT v2.0" },
    { icon: Sun, label: "SOSYAL HİZMETLER" },
    { icon: FileText, label: "EBYS" },
    { icon: Files, label: "DDMS" },
    { icon: Gavel, label: "İKTS" },
    { icon: GraduationCap, label: "LMS" },
    { icon: Lightbulb, label: "IDEAPORT" },
    { icon: Award, label: "KARİYER" },
    { icon: Ticket, label: "MYPASS" },
    { icon: Target, label: "2033 STRATEJİLERİMİZ" },
    { icon: HeartPulse, label: "SAĞLIK" },
  ];

  return (
    <main className="min-h-screen bg-[#f1f2f2] font-sans">
      
      {/* 1. HEADER */}
      <header className="bg-white h-[80px] px-8 flex justify-between items-center shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 rounded-full p-1.5 text-white">
              <Plane size={24} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">TURKISH AIRLINES</span>
          </div>
          <nav className="hidden xl:flex gap-8 text-[13px] font-bold text-slate-600 tracking-wide">
            <span className="text-red-600 border-b-2 border-red-600 pb-7 pt-1 cursor-default">ANASAYFA</span>
            <span className="hover:text-red-600 cursor-default">KURUMSAL</span>
            <span className="hover:text-red-600 cursor-default">ÇALIŞAN DESTEK</span>
            <span className="hover:text-red-600 cursor-default">İLETİŞİM</span>
          </nav>
        </div>
        <div className="hidden md:flex flex-col items-end text-xs text-slate-500">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">TÜRK HAVA YOLLARI'NDA BUGÜN</span>
          <div className="flex items-center gap-2 mt-1">
             <Plane size={14} className="text-red-600 transform -rotate-45" />
             <span className="text-slate-800 font-bold text-lg">1412 UÇUŞ</span>
          </div>
          <div className="flex gap-3 mt-2 font-bold text-slate-400">
            <span>TR</span> | <span>EN</span>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER (VİZYON + UÇAK + MÜDÜR) */}
      <div className="w-full md:h-[500px] flex flex-col md:flex-row overflow-hidden bg-slate-900">
        
        {/* --- SOL TARAF: VİZYON METNİ --- */}
        <div className="w-full md:w-1/3 bg-[#232b38] relative flex flex-col justify-center px-12 py-10 text-white z-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="z-10">
              <div className="flex items-center gap-3 mb-6">
                 <Globe size={36} className="text-red-600" />
                 <h1 className="text-3xl font-black tracking-tighter">SINIRLARI AŞAN VİZYON</h1>
              </div>
              <p className="text-base font-medium leading-relaxed mb-6 text-slate-300">
                "Dünyanın en çok ülkesine uçan havayolu olarak, gücümüzü köklü geçmişimizden ve yenilikçi teknolojimizden alıyoruz. Emniyet, kalite ve misafirperverlik standartlarımızla sadece bugünü değil, havacılığın geleceğini inşa ediyoruz."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-700 pt-6">
                <Star className="text-yellow-500" size={24} fill="currentColor" />
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AVRUPA'NIN EN İYİSİ</p>
                    <p className="text-white font-bold">8. Kez Zirvede</p>
                </div>
              </div>
            </div>
        </div>

        {/* --- SAĞ TARAF: UÇAK ARKAPLANI & MÜDÜR KARTI --- */}
        <div className="w-full md:w-2/3 relative h-[400px] md:h-auto">
           {/* ARKA PLAN: UÇAK FOTOĞRAFI */}
           <div className="absolute inset-0 z-0">
              <img src="/thyuc.jpg" alt="THY 500. Uçak" className="w-full h-full object-cover" />
              {/* Soldan sağa karartma efekti (yazı okunsun diye) */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#232b38] via-[#232b38]/40 to-transparent"></div>
           </div>

           {/* ÖN PLAN: ALPASLAN CEBE KARTI */}
           <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-20 max-w-md">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl flex items-center gap-5 transform hover:scale-105 transition-transform duration-500">
                
                {/* Profil Fotoğrafı */}
                <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-red-600 overflow-hidden shadow-lg">
                        <img src="/alps.jpg" alt="Alpaslan Cebe" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-red-600 p-1.5 rounded-full text-white shadow-sm border-2 border-white">
                        <ShieldCheck size={16} />
                    </div>
                </div>

                {/* Metin Alanı */}
                <div className="text-white">
                    <h3 className="text-xl font-bold tracking-tight">ALPASLAN CEBE</h3>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">THY Güvenlik Müdürü</p>
                    <p className="text-sm italic text-slate-100 leading-snug opacity-90">
                        "Emniyet protokollerindeki reformist yaklaşımı ve üstün liderlik vizyonuyla, gökyüzündeki güvenliğimizin teminatı."
                    </p>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* 3. GRID ALANI (Koyu Kutucuklar) */}
      <div className="bg-[#232b38] w-full py-10 px-4 md:px-12 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-w-[1800px] mx-auto">
          
          {/* --- AKTİF KUTU --- */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2d3748] group hover:bg-[#d3121d] transition-all duration-300 h-32 flex flex-col items-center justify-center gap-3 rounded-lg border-b-2 border-transparent hover:border-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
            
            <ScanFace size={32} className="text-slate-300 group-hover:text-white transition-colors" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white text-center px-2 leading-tight">
              ZİYARETÇİ<br/>İŞLEMLERİ
            </span>
          </button>

          {/* PASİF KUTULAR */}
          {passiveItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-[#2d3748] h-32 flex flex-col items-center justify-center gap-3 rounded-lg border-b-2 border-transparent opacity-80 cursor-default"
            >
              <item.icon size={28} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 text-center px-2 leading-tight uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#232b38] p-5 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Globe className="text-red-600" size={24} />
                <h3 className="text-white font-bold text-lg tracking-wide">ZİYARETÇİ İŞLEM MERKEZİ</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 bg-slate-50 grid gap-4">
              <Link href="/ziyaretci-formu" className="flex items-center gap-4 p-4 bg-white border-l-4 border-blue-600 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
                <div><h4 className="font-bold text-slate-800">Ziyaret Talebi Oluştur</h4><p className="text-xs text-slate-500 mt-1">Dışarıdan gelecek misafir kaydı</p></div>
              </Link>
              <Link href="/guvenlik-giris" className="flex items-center gap-4 p-4 bg-white border-l-4 border-emerald-600 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><ScanFace size={24} /></div>
                <div><h4 className="font-bold text-slate-800">Güvenlik Personel Girişi</h4><p className="text-xs text-slate-500 mt-1">Kampüs giriş/çıkış kontrolü</p></div>
              </Link>
              <Link href="/idari-giris" className="flex items-center gap-4 p-4 bg-white border-l-4 border-slate-800 shadow-sm hover:shadow-md hover:translate-x-1 transition-all rounded-r-lg group">
                <div className="bg-slate-100 p-3 rounded-lg text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors"><Files size={24} /></div>
                <div><h4 className="font-bold text-slate-800">İdari Yönetim Paneli</h4><p className="text-xs text-slate-500 mt-1">Tüm sistem raporları ve ayarlar</p></div>
              </Link>
            </div>
            <div className="bg-slate-100 p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200">
              Güvenli Erişim Protokolü v2.4
            </div>
          </div>
        </div>
      )}
    </main>
  );
}