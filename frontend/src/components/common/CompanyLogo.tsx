import React, { useState } from 'react';

// Brand colors and custom typography emblems for authentic Indian corporate identity
interface BrandStyle {
  bg: string;
  fg: string;
  accent?: string;
  text: string;
  domain?: string;
}

const BRAND_CONFIG: Record<string, BrandStyle> = {
  RELIANCE: { bg: '#004b93', fg: '#ffffff', text: 'RIL', domain: 'ril.com' },
  TCS: { bg: '#003366', fg: '#ffffff', text: 'TCS', domain: 'www.tcs.com' },
  HDFCBANK: { bg: '#004c8f', fg: '#ffffff', accent: '#ed232a', text: 'HDFC', domain: 'www.hdfcbank.com' },
  INFY: { bg: '#007cc3', fg: '#ffffff', text: 'INFY', domain: 'www.infosys.com' },
  ICICIBANK: { bg: '#8b0000', fg: '#ffffff', accent: '#f37021', text: 'ICICI', domain: 'www.icicibank.com' },
  BHARTIARTL: { bg: '#ed1c24', fg: '#ffffff', text: 'airtel', domain: 'www.airtel.in' },
  SBIN: { bg: '#00b5ef', fg: '#280071', text: 'SBI', domain: 'www.onlinesbi.sbi' },
  ITC: { bg: '#005a2b', fg: '#ffd700', text: 'ITC', domain: 'www.itcportal.com' },
  LT: { bg: '#002044', fg: '#fdb913', text: 'L&T', domain: 'www.larsentoubro.com' },
  HINDUNILVR: { bg: '#001a9c', fg: '#ffffff', text: 'HUL', domain: 'www.hul.co.in' },
  BAJFINANCE: { bg: '#00509d', fg: '#ffffff', text: 'BAJAJ', domain: 'www.bajajfinserv.in' },
  TATAMOTORS: { bg: '#1d3354', fg: '#ffffff', text: 'TATA', domain: 'www.tatamotors.com' },
  MARUTI: { bg: '#e31e24', fg: '#ffffff', text: 'MARUTI', domain: 'www.marutisuzuki.com' },
  SUNPHARMA: { bg: '#e85d04', fg: '#ffffff', text: 'SUN', domain: 'www.sunpharma.com' },
  TITAN: { bg: '#111827', fg: '#e5e7eb', accent: '#d97706', text: 'TITAN', domain: 'www.titancompany.in' },
  AXISBANK: { bg: '#97144d', fg: '#ffffff', text: 'AXIS', domain: 'www.axisbank.com' },
  KOTAKBANK: { bg: '#ea1b26', fg: '#ffffff', text: 'KOTAK', domain: 'www.kotak.com' },
  WIPRO: { bg: '#2b2d42', fg: '#ffffff', accent: '#ff007f', text: 'WIPRO', domain: 'www.wipro.com' },
  ADANIENT: { bg: '#004c87', fg: '#ffffff', text: 'ADANI', domain: 'www.adanienterprises.com' },
  NTPC: { bg: '#00529b', fg: '#f58220', text: 'NTPC', domain: 'www.ntpc.co.in' },
  POWERGRID: { bg: '#00843d', fg: '#ffffff', text: 'GRID', domain: 'www.powergrid.in' },
  'M&M': { bg: '#d90429', fg: '#ffffff', text: 'M&M', domain: 'www.mahindra.com' },
  ULTRACEMCO: { bg: '#fbbf24', fg: '#000000', text: 'ULTRA', domain: 'www.ultratechcement.com' },
  ASIANPAINT: { bg: '#d90429', fg: '#ffffff', accent: '#fbbf24', text: 'AP', domain: 'www.asianpaints.com' },
  COALINDIA: { bg: '#1e293b', fg: '#f59e0b', text: 'CIL', domain: 'www.coalindia.in' },
  BAJAJFINSV: { bg: '#00509d', fg: '#ffffff', text: 'FINSV', domain: 'www.bajajfinserv.in' },
  ONGC: { bg: '#b91c1c', fg: '#ffffff', text: 'ONGC', domain: 'www.ongcindia.com' },
  NESTLEIND: { bg: '#2c3e50', fg: '#ffffff', text: 'NESTLE', domain: 'www.nestle.in' },
  JSWSTEEL: { bg: '#002f6c', fg: '#e11d48', text: 'JSW', domain: 'www.jsw.in' },
  TATASTEEL: { bg: '#1e3a8a', fg: '#ffffff', text: 'TATA', domain: 'www.tatasteel.com' },
  GRASIM: { bg: '#0f172a', fg: '#f59e0b', text: 'GRASIM', domain: 'www.adityabirla.com' },
  HCLTECH: { bg: '#0072ce', fg: '#ffffff', text: 'HCL', domain: 'www.hcltech.com' },
  TECHM: { bg: '#e11d48', fg: '#ffffff', text: 'TECHM', domain: 'www.techmahindra.com' },
  CIPLA: { bg: '#0284c7', fg: '#ffffff', text: 'CIPLA', domain: 'www.cipla.com' },
  DRREDDY: { bg: '#6b21a8', fg: '#ffffff', text: 'DR.R', domain: 'www.drreddys.com' },
  HEROMOTOCO: { bg: '#dc2626', fg: '#ffffff', text: 'HERO', domain: 'www.heromotocorp.com' },
  DIVISLAB: { bg: '#0369a1', fg: '#ffffff', text: 'DIVIS', domain: 'www.divislabs.com' },
  EICHERMOT: { bg: '#991b1b', fg: '#ffffff', text: 'RE', domain: 'www.royalenfield.com' },
  BPCL: { bg: '#047857', fg: '#facc15', text: 'BPCL', domain: 'www.bharatpetroleum.in' },
  APOLLOHOSP: { bg: '#15803d', fg: '#ffffff', text: 'APOLLO', domain: 'www.apollohospitals.com' },
  BRITANNIA: { bg: '#b91c1c', fg: '#fef08a', text: 'BRIT', domain: 'www.britannia.co.in' },
  TATACONSUM: { bg: '#1d4ed8', fg: '#ffffff', text: 'TATA', domain: 'www.tataconsumer.com' },
  INDUSINDBK: { bg: '#7f1d1d', fg: '#fde047', text: 'INDUS', domain: 'www.indusind.com' },
  SHRIRAMFIN: { bg: '#c2410c', fg: '#ffffff', text: 'SHRIRAM', domain: 'www.shriramfinance.in' },
  'BAJAJ-AUTO': { bg: '#00509d', fg: '#ffffff', text: 'BAJAJ', domain: 'www.bajajauto.com' },
  SBILIFE: { bg: '#0284c7', fg: '#ffffff', text: 'SBI-L', domain: 'www.sbilife.co.in' },
  HDFCLIFE: { bg: '#be123c', fg: '#ffffff', text: 'HDFC-L', domain: 'www.hdfclife.com' },
  GAIL: { bg: '#002f6c', fg: '#f59e0b', text: 'GAIL', domain: 'gailonline.co.in' },
  ADANIPORTS: { bg: '#0284c7', fg: '#ffffff', text: 'APSEZ', domain: 'www.adaniports.com' },
  ADANIGREEN: { bg: '#16a34a', fg: '#ffffff', text: 'AGEL', domain: 'www.adanigreenenergy.com' },
  ADANIPOWER: { bg: '#ea580c', fg: '#ffffff', text: 'APL', domain: 'www.adanipower.com' },
  AMBUJACEM: { bg: '#0f766e', fg: '#fef08a', text: 'AMBUJA', domain: 'www.ambujacement.com' },
  BANKBARODA: { bg: '#ea580c', fg: '#ffffff', text: 'BOB', domain: 'www.bankofbaroda.in' },
  BEL: { bg: '#1e3a8a', fg: '#facc15', text: 'BEL', domain: 'www.bel-india.in' },
  BHEL: { bg: '#b91c1c', fg: '#ffffff', text: 'BHEL', domain: 'www.bhel.com' },
  BOSCHLTD: { bg: '#e11d48', fg: '#ffffff', text: 'BOSCH', domain: 'www.bosch.in' },
  CANBK: { bg: '#0284c7', fg: '#facc15', text: 'CANARA', domain: 'www.canarabank.com' },
  CHOLAFIN: { bg: '#1e3a8a', fg: '#fbbf24', text: 'CHOLA', domain: 'www.cholamandalam.com' },
  COLPAL: { bg: '#dc2626', fg: '#ffffff', text: 'COLG', domain: 'www.colgatepalmolive.co.in' },
  DABUR: { bg: '#15803d', fg: '#ffffff', text: 'DABUR', domain: 'www.dabur.com' },
  DLF: { bg: '#1e293b', fg: '#38bdf8', text: 'DLF', domain: 'www.dlf.in' },
  GODREJCP: { bg: '#be123c', fg: '#ffffff', text: 'GCPL', domain: 'www.godrejcp.com' },
  GODREJPROP: { bg: '#0369a1', fg: '#ffffff', text: 'GPL', domain: 'www.godrejproperties.com' },
  HAVELLS: { bg: '#b91c1c', fg: '#ffffff', text: 'HAVELLS', domain: 'www.havells.com' },
  HAL: { bg: '#0369a1', fg: '#facc15', text: 'HAL', domain: 'www.hal-india.co.in' },
  HINDALCO: { bg: '#1e3a8a', fg: '#f59e0b', text: 'HIND', domain: 'www.hindalco.com' },
  ICICIGI: { bg: '#991b1b', fg: '#ffffff', text: 'LOMB', domain: 'www.icicilombard.com' },
  ICICIPRULI: { bg: '#991b1b', fg: '#ffffff', text: 'PRU', domain: 'www.iciciprulife.com' },
  IOC: { bg: '#ea580c', fg: '#1e3a8a', text: 'IOCL', domain: 'www.iocl.com' },
  IRCTC: { bg: '#1e3a8a', fg: '#facc15', text: 'IRCTC', domain: 'www.irctc.co.in' },
  IRFC: { bg: '#0f766e', fg: '#ffffff', text: 'IRFC', domain: 'www.irfc.co.in' },
  JINDALSTEL: { bg: '#1e293b', fg: '#e11d48', text: 'JSPL', domain: 'www.jindalsteelpower.com' },
  JIOFIN: { bg: '#004b93', fg: '#ffffff', text: 'JIO', domain: 'www.jio.com' },
  LTIM: { bg: '#0284c7', fg: '#ffffff', text: 'LTIM', domain: 'www.ltimindtree.com' },
  LUPIN: { bg: '#15803d', fg: '#ffffff', text: 'LUPIN', domain: 'www.lupin.com' },
  MARICO: { bg: '#0369a1', fg: '#facc15', text: 'MARICO', domain: 'www.marico.com' },
  MOTHERSON: { bg: '#111827', fg: '#ffffff', text: 'MOTH', domain: 'www.motherson.com' },
  MUTHOOTFIN: { bg: '#b91c1c', fg: '#facc15', text: 'MUTH', domain: 'www.muthootfinance.com' },
  NAUKRI: { bg: '#0284c7', fg: '#ffffff', text: 'NAUKRI', domain: 'www.naukri.com' },
  NHPC: { bg: '#0369a1', fg: '#facc15', text: 'NHPC', domain: 'www.nhpcindia.com' },
  PERSISTENT: { bg: '#ea580c', fg: '#ffffff', text: 'PSYS', domain: 'www.persistent.com' },
  PIDILITIND: { bg: '#facc15', fg: '#1e3a8a', text: 'FEVI', domain: 'www.pidilite.com' },
  PFC: { bg: '#047857', fg: '#ffffff', text: 'PFC', domain: 'www.pfcindia.com' },
  PNB: { bg: '#991b1b', fg: '#facc15', text: 'PNB', domain: 'www.pnbindia.in' },
  RECLTD: { bg: '#0f766e', fg: '#ffffff', text: 'REC', domain: 'www.recindia.nic.in' },
  SBICARD: { bg: '#00b5ef', fg: '#280071', text: 'CARD', domain: 'www.sbicard.com' },
  SIEMENS: { bg: '#00646e', fg: '#ffffff', text: 'SIEM', domain: 'www.siemens.com' },
  SRF: { bg: '#1e3a8a', fg: '#facc15', text: 'SRF', domain: 'www.srf.com' },
  TATACOMM: { bg: '#1d4ed8', fg: '#ffffff', text: 'TCL', domain: 'www.tatacommunications.com' },
  TATAPOWER: { bg: '#1e3a8a', fg: '#38bdf8', text: 'TPWR', domain: 'www.tatapower.com' },
  TORNTPHARM: { bg: '#0369a1', fg: '#ffffff', text: 'TORR', domain: 'www.torrentpharma.com' },
  TRENT: { bg: '#18181b', fg: '#f59e0b', text: 'TRENT', domain: 'www.mywestside.com' },
  TVSMOTOR: { bg: '#b91c1c', fg: '#ffffff', text: 'TVS', domain: 'www.tvsmotor.com' },
  VBL: { bg: '#0369a1', fg: '#ffffff', text: 'VBL', domain: 'www.varunpepsi.com' },
  VEDL: { bg: '#0f172a', fg: '#e11d48', text: 'VEDL', domain: 'www.vedantalimited.com' },
  ZOMATO: { bg: '#cb202d', fg: '#ffffff', text: 'ZOMATO', domain: 'www.zomato.com' },
  ZYDUSLIFE: { bg: '#4338ca', fg: '#ffffff', text: 'ZYDUS', domain: 'www.zyduslife.com' },
  POLYCAB: { bg: '#b91c1c', fg: '#ffffff', text: 'POLY', domain: 'www.polycab.com' },
  TATAELXSI: { bg: '#1e3a8a', fg: '#38bdf8', text: 'ELXSI', domain: 'www.tataelxsi.com' },
  MAXHEALTH: { bg: '#0d9488', fg: '#ffffff', text: 'MAX', domain: 'www.maxhealthcare.in' },
  BERGEPAINT: { bg: '#dc2626', fg: '#facc15', text: 'BERGE', domain: 'www.bergerpaints.com' },
  CGPOWER: { bg: '#0284c7', fg: '#ffffff', text: 'CG', domain: 'www.cgpower.com' },
};

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  size?: number;
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  name,
  size = 36,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const cleanSym = symbol ? symbol.toUpperCase().replace('.NS', '') : '';
  const brand = BRAND_CONFIG[cleanSym];

  const domain = brand?.domain || `${cleanSym.toLowerCase()}.com`;
  const logoUrl = domain
    ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`
    : null;

  // Render branded corporate emblem
  const renderBrandedEmblem = () => {
    const bg = brand?.bg || '#18181b';
    const fg = brand?.fg || '#ffffff';
    const displayText = brand?.text || cleanSym.slice(0, 3);
    const fontSize = Math.max(9, Math.floor(size * (displayText.length > 3 ? 0.26 : 0.34)));

    return (
      <div
        className={`rounded-2xl flex items-center justify-center font-black tracking-tight shrink-0 shadow-sm border border-black/10 select-none overflow-hidden relative ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          color: fg,
          fontSize: `${fontSize}px`,
        }}
        title={name || cleanSym}
      >
        {/* Subtle glossy gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20 pointer-events-none" />
        <span className="relative z-10 font-black">{displayText}</span>
        {brand?.accent && (
          <span
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: brand.accent }}
          />
        )}
      </div>
    );
  };

  // If image errored or no domain, render the branded corporate emblem
  if (!logoUrl || imageError) {
    return renderBrandedEmblem();
  }

  return (
    <div
      className={`relative rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1 select-none ${className}`}
      style={{ width: size, height: size }}
      title={name || cleanSym}
    >
      <img
        src={logoUrl}
        alt={name || cleanSym}
        className="w-full h-full object-contain rounded-xl"
        loading="lazy"
        onLoad={(e) => {
          const img = e.currentTarget;
          // Google's default fallback globe image is 16x16 or empty - swap to branded emblem!
          if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
            setImageError(true);
          }
        }}
        onError={() => setImageError(true)}
      />
    </div>
  );
};
