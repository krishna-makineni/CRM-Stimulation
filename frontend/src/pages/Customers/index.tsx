import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, Search, Users, Filter, ChevronRight, Mail, Phone, MapPin } from 'lucide-react';
import { customerApi, orderApi } from '@/services/customerApi';
import { CustomerTable } from '@/components/CustomerTable';

const tierConfig: Record<string, { color: string; bg: string; border: string }> = {
  Platinum: { color: '#e2e8f0', bg: 'rgba(226,232,240,0.12)', border: 'rgba(226,232,240,0.25)' },
  Gold:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  Silver:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  Bronze:   { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)' },
};

export function Customers() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApi.list(search),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await customerApi.importCsv(file);
    refetch();
  };

  const handleImportOrders = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await orderApi.importCsv(file);
    refetch();
  };

  const tierCounts = data?.customers?.reduce((acc: Record<string, number>, c: { loyaltyTier: string }) => {
    acc[c.loyaltyTier] = (acc[c.loyaltyTier] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Customers
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {data?.total?.toLocaleString('en-IN') || 0} Nykaa beauty contacts across India
          </p>
        </div>
        <div className="flex gap-2">
          <label>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <span
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-white/70 transition-all hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              Import Customers
            </span>
          </label>
          <label>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportOrders} />
            <span
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-white/70 transition-all hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              Import Orders
            </span>
          </label>
        </div>
      </div>

      {/* Tier Stats */}
      <div className="grid grid-cols-4 gap-3">
        {['Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => {
          const cfg = tierConfig[tier];
          const count = tierCounts[tier] || 0;
          const pct = data?.total ? Math.round((count / data.total) * 100) : 0;
          return (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? '' : tier)}
              className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
              style={{
                background: tierFilter === tier ? cfg.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${tierFilter === tier ? cfg.border : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{tier}</span>
                <div className="h-5 w-5 rounded-full flex items-center justify-center"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Users className="h-2.5 w-2.5" style={{ color: cfg.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{count.toLocaleString('en-IN')}</p>
              <p className="text-xs text-white/35 mt-0.5">{pct}% of total</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div
          className="flex flex-1 max-w-sm items-center gap-2 rounded-xl px-4 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white/50 hover:text-white/80 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
        {tierFilter && (
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer"
            onClick={() => setTierFilter('')}
            style={{
              background: tierConfig[tierFilter]?.bg,
              color: tierConfig[tierFilter]?.color,
              border: `1px solid ${tierConfig[tierFilter]?.border}`,
            }}
          >
            {tierFilter} ×
          </span>
        )}
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={(data?.customers || []).filter((c: { loyaltyTier: string }) =>
          !tierFilter || c.loyaltyTier === tierFilter
        )}
        isLoading={isLoading}
      />
    </div>
  );
}
