"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  User, Briefcase, Calendar, Clock, 
  Phone, CreditCard, FileText, Truck, Building2, 
  CheckCircle, CloudSun, UserPlus, X, ShieldCheck, Trash2 
} from "lucide-react";

export default function ZiyaretciForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showKvkk, setShowKvkk] = useState(false);
  
  // Ekstra Kişi Ekleme Modalı ve Listesi
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [extraVisitors, setExtraVisitors] = useState<any[]>([]);
  const [tempPerson, setTempPerson] = useState({ adSoyad: "", tc: "" });

  const [kampusler, setKampusler] = useState<any[]>([]);

  // BUGÜNÜN TARİHİ
  const bugun = new Date().toISOString().split("T")[0];

  // Ana Form Verileri
  const [formData, setFormData] = useState({
    adSoyad: "",
    tc: "",
    gsm: "",
    kampus_id: "",
    evSahibi: "",
    neden: "",
    tarih: "",
    saat: "",
    plaka: "",
    firma: "",
    tip: "sahsi", 
    kvkk: false
  });

  useEffect(() => {
    async function getKampusler() {
      const { data } = await supabase.from('kampusler').select('*');
      if (data) setKampusler(data);
    }
    getKampusler();
  }, []);

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.name === 'tc' || e.target.name === 'gsm') {
        if (!/^\d*$/.test(value)) return; 
    }
    if ((e.target.name === 'tc' || e.target.name === 'gsm') && value.length > 11) return;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // --- EKSTRA KİŞİ EKLEME MANTIĞI ---
  const handleAddTempPerson = () => {
     if (!tempPerson.adSoyad || tempPerson.tc.length !== 11) {
         alert("Lütfen Ad Soyad ve 11 haneli TC giriniz.");
         return;
     }
     setExtraVisitors([...extraVisitors, { ...tempPerson, id: Date.now() }]);
     setTempPerson({ adSoyad: "", tc: "" }); // Temizle
     setShowAddPersonModal(false); // Kapat
  };

  const removeExtraPerson = (id: number) => {
      setExtraVisitors(extraVisitors.filter(p => p.id !== id));
  };

  // --- KAYIT MANTIĞI ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ana Form Validasyonu
    if (!formData.kvkk) { alert("Lütfen KVKK metnini onaylayınız."); return; }
    if (formData.tc.length !== 11) { alert("Ana ziyaretçi TC Kimlik No 11 hane olmalıdır."); return; }
    if (formData.gsm.length !== 11) { alert("GSM numarası 11 hane olmalıdır."); return; }
    if (formData.tip === 'destek' && !formData.firma) { alert("Firma bilgisi zorunludur."); return; }

    setLoading(true);

    // 2. Kayıt Listesini Hazırla (Ana Kişi + Eklenenler)
    const tumZiyaretciler = [
        // Ana Formdaki Kişi
        {
            ziyaretci_ad_soyad: formData.adSoyad,
            ziyaretci_tc: formData.tc,
            ziyaretci_gsm: formData.gsm,
            kampus_id: Number(formData.kampus_id),
            ziyaret_edilecek_kisi: formData.evSahibi,
            ziyaret_nedeni: formData.neden, 
            ziyaret_tarihi: formData.tarih,
            ziyaret_saati: formData.saat,
            plaka: formData.tip === 'destek' ? formData.plaka : "",
            firma_bilgisi: formData.tip === 'destek' ? formData.firma : "",
            durum: "onaylandi"
        },
        // Ekstra Eklenen Kişiler
        ...extraVisitors.map(p => ({
            ziyaretci_ad_soyad: p.adSoyad,
            ziyaretci_tc: p.tc,
            ziyaretci_gsm: formData.gsm,
            kampus_id: Number(formData.kampus_id),
            ziyaret_edilecek_kisi: formData.evSahibi,
            ziyaret_nedeni: formData.neden,
            ziyaret_tarihi: formData.tarih,
            ziyaret_saati: formData.saat,
            plaka: formData.tip === 'destek' ? formData.plaka : "",
            firma_bilgisi: formData.tip === 'destek' ? formData.firma : "",
            durum: "onaylandi"
        }))
    ];

    const { error } = await supabase.from("talepler").insert(tumZiyaretciler);

    setLoading(false);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      setSuccess(true);
    }
  };

  // --- BAŞARI EKRANI ---
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0">
             <img src="/thy_m2.jpg" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
        </div>
        <div className="bg-white/90 backdrop-blur-md relative z-10 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <CheckCircle className="text-emerald-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">Kayıt Başarılı!</h2>
          <p className="text-slate-600 mt-2 mb-6">Toplam {1 + extraVisitors.length} kişilik ziyaret talebiniz iletildi.</p>
          <button 
            onClick={() => { setSuccess(false); setExtraVisitors([]); setFormData({...formData, adSoyad: "", tc: "", gsm: "", evSahibi: "", neden: "", tarih: "", saat: "", plaka: "", firma: "", kvkk: false}); }}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            Yeni Talep Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden p-4">
      
      {/* ARKAPLAN */}
      <div className="absolute inset-0 z-0">
         <img src="/thy_m2.jpg" className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* WIDGETS */}
      <div className="absolute top-6 right-6 z-20 hidden md:block">
         <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white flex items-center gap-4 shadow-lg">
            <div>
               <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">İSTANBUL (IST)</div>
               <div className="text-3xl font-black">14°C</div>
            </div>
            <CloudSun size={32} className="text-white"/>
         </div>
      </div>

      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-3">
         <div className="bg-red-600 p-3 rounded-xl shadow-lg shadow-red-600/30">
            <img src="/logo_1.png" className="w-6 h-6 brightness-0 invert object-contain" />
         </div>
         <div>
            <h3 className="text-white font-black text-xl tracking-tight">İSTİKBAL GÖKLERDEDİR</h3>
            <p className="text-white/60 text-xs">"Avrupa'nın en iyi havayolu olarak..."</p>
         </div>
      </div>

      {/* MERKEZİ FORM KARTI */}
      <div className="w-full max-w-4xl relative z-10">
        
        {/* BAŞLIK ALANI (LOGO SİLİNDİ, SADECE YAZI KALDI) */}
        <div className="flex flex-col items-center mb-6">
            <h1 className="text-white font-black text-2xl mt-2 drop-shadow-md">THY GÜVENLİK DİREKTÖRLÜĞÜ</h1>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-white/50">
           
           <div className="text-center mb-8">
              <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
                 <User className="text-slate-800" size={24}/> ZİYARETÇİ KAYIT FORMU
              </h2>
              
              <div className="flex justify-center mt-6">
                 <div className="bg-slate-100 p-1 rounded-full inline-flex relative w-full max-w-sm border border-slate-200">
                    <button onClick={() => setFormData({...formData, tip: 'sahsi'})} className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all z-10 ${formData.tip === 'sahsi' ? 'bg-white text-red-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Şahsi Ziyaret</button>
                    <button onClick={() => setFormData({...formData, tip: 'destek'})} className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all z-10 ${formData.tip === 'destek' ? 'bg-white text-red-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Destek / Teknik</button>
                 </div>
              </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  
                  {/* Ad Soyad & Kişi Ekle */}
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-end">
                          <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ad Soyad <span className="text-red-500">*</span></label>
                          <button 
                            type="button" 
                            onClick={() => setShowAddPersonModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors shadow-md"
                          >
                            <UserPlus size={12}/> + Kişi Ekle
                          </button>
                      </div>
                      
                      <div className="relative group">
                         <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required name="adSoyad" value={formData.adSoyad} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="Ad Soyad" />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">TC Kimlik No <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <CreditCard className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required name="tc" maxLength={11} value={formData.tc} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="11 Haneli TC" />
                      </div>
                  </div>

                  {/* EKSTRA KİŞİLER LİSTESİ */}
                  {extraVisitors.length > 0 && (
                      <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3 animate-in fade-in">
                          <p className="text-[10px] font-bold text-blue-600 uppercase mb-2 ml-1">EKLENEN DİĞER KİŞİLER:</p>
                          <div className="flex flex-wrap gap-2">
                              {extraVisitors.map((p, idx) => (
                                  <div key={p.id} className="bg-white border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                                      <span>{idx + 1}. {p.adSoyad} ({p.tc})</span>
                                      <button type="button" onClick={() => removeExtraPerson(p.id)} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 size={12}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">GSM <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <Phone className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required name="gsm" maxLength={11} value={formData.gsm} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="05XX..." />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ziyaret Edilecek Kişi <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required name="evSahibi" value={formData.evSahibi} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="Personel Adı" />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Kampüs <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <Building2 className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <select required name="kampus_id" value={formData.kampus_id} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none transition-all text-sm">
                            <option value="">Seçiniz...</option>
                            {kampusler.map(k => (<option key={k.id} value={k.id}>{k.isim}</option>))}
                         </select>
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tarih <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <Calendar className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required type="date" name="tarih" min={bugun} value={formData.tarih} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm" />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Randevu Saati <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <Clock className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required type="time" name="saat" value={formData.saat} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm" />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ziyaret Nedeni <span className="text-red-500">*</span></label>
                      <div className="relative group">
                         <FileText className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-800" size={18}/>
                         <input required name="neden" value={formData.neden} onChange={handleChange} className="w-full pl-11 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm" placeholder="Ziyaret Sebebi..." />
                      </div>
                  </div>

                  {formData.tip === 'destek' && (
                      <>
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[11px] font-bold text-red-600 uppercase ml-1">Araç Plakası</label>
                             <div className="relative group">
                                <Truck className="absolute left-3.5 top-3.5 text-red-500 group-focus-within:text-red-700" size={18}/>
                                <input name="plaka" value={formData.plaka} onChange={handleChange} className="w-full pl-11 p-3 bg-red-50 border border-red-100 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-red-300 text-sm" placeholder="34 AB 123" />
                             </div>
                          </div>
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[11px] font-bold text-red-600 uppercase ml-1">Firma Adı <span className="text-red-500">*</span></label>
                             <div className="relative group">
                                <Briefcase className="absolute left-3.5 top-3.5 text-red-500 group-focus-within:text-red-700" size={18}/>
                                <input required name="firma" value={formData.firma} onChange={handleChange} className="w-full pl-11 p-3 bg-red-50 border border-red-100 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-red-300 text-sm" placeholder="Firma Adı" />
                             </div>
                          </div>
                      </>
                  )}
              </div>

              <div className="pt-6 mt-4 border-t border-slate-200/60">
                  <div className="flex items-start gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <input type="checkbox" name="kvkk" checked={formData.kvkk} onChange={handleChange} id="kvkk" className="mt-0.5 w-5 h-5 accent-emerald-600 cursor-pointer" />
                     <label htmlFor="kvkk" className="text-xs text-slate-500 font-medium cursor-pointer leading-relaxed">
                        Kişisel verilerimin, <button type="button" onClick={() => setShowKvkk(true)} className="text-emerald-600 font-bold underline hover:text-emerald-700">KVKK Aydınlatma Metni</button> kapsamında işlenmesini ve kaydedilmesini kabul ediyorum.
                     </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !formData.kvkk}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-emerald-600/20 transform active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "KAYIT OLUŞTURULUYOR..." : "KAYDI OLUŞTUR"}
                  </button>
              </div>

           </form>
           
           <div className="text-center mt-6">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">THY GÜVENLİK DİREKTÖRLÜĞÜ</p>
           </div>
        </div>
      </div>

      {/* --- KİŞİ EKLEME MODALI --- */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                 <h3 className="font-bold text-sm flex items-center gap-2"><UserPlus size={18}/> EKSTRA MİSAFİR EKLE</h3>
                 <button onClick={() => setShowAddPersonModal(false)} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={16}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={tempPerson.adSoyad}
                      onChange={(e) => setTempPerson({...tempPerson, adSoyad: e.target.value})}
                      className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-bold text-slate-700 text-sm"
                      placeholder="Misafir Adı"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">TC Kimlik No</label>
                    <input 
                      type="text" 
                      maxLength={11}
                      value={tempPerson.tc}
                      onChange={(e) => { if(/^\d*$/.test(e.target.value)) setTempPerson({...tempPerson, tc: e.target.value}) }}
                      className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-bold text-slate-700 text-sm"
                      placeholder="11 Haneli TC"
                    />
                 </div>
                 <button 
                   onClick={handleAddTempPerson}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg mt-2"
                 >
                   LİSTEYE EKLE
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- KVKK MODAL --- */}
      {showKvkk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                 <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={20}/> KVKK AYDINLATMA METNİ</h3>
                 <button onClick={() => setShowKvkk(false)} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={18}/></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed">
                 <p className="font-bold text-slate-800">Türk Hava Yolları A.O. ve TSS (Turkish Support Services) Ziyaretçi Aydınlatma Metni</p>
                 <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kimlik (ad, soyad, TC kimlik no), iletişim (telefon numarası) ve işlem güvenliği (giriş-çıkış saatleri, plaka bilgisi) verileriniz; fiziksel mekan güvenliğinin temini, ziyaretçi kayıtlarının oluşturulması ve takibi amaçlarıyla işlenmektedir.</p>
                 <p>Söz konusu kişisel verileriniz, hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaatlerimiz kapsamında, otomatik yollarla işlenmekte olup, yetkili kamu kurum ve kuruluşları dışında üçüncü kişilerle paylaşılmamaktadır.</p>
                 <p>Detaylı bilgi için kurumumuzun KVKK politikasını inceleyebilirsiniz.</p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                 <button 
                   onClick={() => { setShowKvkk(false); setFormData({...formData, kvkk: true}); }} 
                   className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                 >
                   Okudum, Anlıyorum
                 </button>
              </div>
           </div>
        </div>
      )}

    </main>
  );
}