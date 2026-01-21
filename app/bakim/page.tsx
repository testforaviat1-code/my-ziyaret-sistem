export default function BakimSayfasi() {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' }}>
        <span style={{ fontSize: '50px' }}>✈️</span>
        <h1 style={{ color: '#003366' }}>Teknik Bakım Çalışması</h1>
        <p style={{ fontSize: '18px', color: '#555' }}>
          Ziyaretçi Yönetim Sistemi şu an <strong>hangarda</strong> güçlendiriliyor.
        </p>
        <p>Yaklaşık 2 gün sonra tekrar pistte olacağız.</p>
        <div style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ffcc00', borderRadius: '20px', fontWeight: 'bold' }}>
          DURUM: BAKIMDA
        </div>
      </div>
    );
  }