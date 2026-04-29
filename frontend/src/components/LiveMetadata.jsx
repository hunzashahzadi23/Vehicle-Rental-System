import { useState, useEffect } from 'react';

// Simulated GPS locations for active rentals
const GPS_LOCATIONS = [
  'Clifton, Karachi — 24.8124° N, 67.0299° E',
  'DHA Phase 5, Karachi — 24.7979° N, 67.0634° E',
  'Gulshan-e-Iqbal, Karachi — 24.9212° N, 67.0934° E',
  'North Nazimabad, Karachi — 24.9438° N, 67.0330° E',
  'Saddar, Karachi — 24.8466° N, 67.0194° E',
];

export default function LiveMetadata({ vehicleId }) {
  const [time, setTime] = useState(new Date());
  const [locIdx] = useState(() => Math.floor(Math.random() * GPS_LOCATIONS.length));
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const p = setInterval(() => setPulse(v => !v), 1200);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);

  const fmt = (d) => d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{
      background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          boxShadow: pulse ? '0 0 8px #22c55e, 0 0 16px rgba(34,197,94,0.4)' : 'none',
          transition: 'box-shadow 0.4s ease',
        }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Tracking
        </span>
      </div>

      {/* Date & Time */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>DATE</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{fmtDate(time)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>TIME</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>{fmt(time)}</div>
        </div>
      </div>

      {/* GPS */}
      <div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>GPS · SIMULATED LOCATION</div>
        <div style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 500 }}>{GPS_LOCATIONS[locIdx]}</div>
      </div>
    </div>
  );
}
