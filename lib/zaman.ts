export const getTRMidnightISO = () => {
    const simdi = new Date();
    
    const formatter = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(simdi);
    const gun = parts.find(p => p.type === 'day')?.value;
    const ay = parts.find(p => p.type === 'month')?.value;
    const yil = parts.find(p => p.type === 'year')?.value;
    
    // Türkiye saatine göre gece 00:00:00 mührü
    return `${yil}-${ay}-${gun}T00:00:00+03:00`;
  };