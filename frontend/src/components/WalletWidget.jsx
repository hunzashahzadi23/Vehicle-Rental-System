import { Wallet, Lock } from 'lucide-react';

// WalletWidget — Shows Available vs Locked (Escrow) balance in PKR
export default function WalletWidget({ available = 0, locked = 0 }) {
  const total     = available + locked;
  const availPct  = total > 0 ? (available / total) * 100 : 100;
  const pkr       = (n) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ display:'flex', alignItems:'center', gap:6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          <Wallet size={14} /> My Wallet
        </span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: '#fff' }}>
          {pkr(total)}
        </span>
      </div>

      {/* Balance bar */}
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${availPct}%`,
          background: 'linear-gradient(90deg,#22c55e,#16a34a)',
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 0 8px rgba(34,197,94,0.5)',
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Available</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80' }}>{pkr(available)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f24e1e' }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Locked (Escrow)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fb923c' }}>{pkr(locked)}</div>
          </div>
        </div>
      </div>

      {locked > 0 && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 8,
          background: 'rgba(242,78,30,0.1)', border: '1px solid rgba(242,78,30,0.2)',
          fontSize: '0.78rem', color: '#fbbf24',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Lock size={13} /> {pkr(locked)} held in escrow — released on vehicle return
        </div>
      )}
    </div>
  );
}
