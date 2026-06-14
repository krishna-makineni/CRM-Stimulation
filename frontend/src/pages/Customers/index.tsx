import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Upload, Search, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { customerApi, orderApi } from '@/services/customerApi';
import { CustomerTable } from '@/components/CustomerTable';
import { cn } from '@/lib/utils';

const categories = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'At risk'] as const;
const tierLevels = ['Platinum', 'Gold', 'Silver', 'Bronze'] as const;

type CustomerCategory = typeof categories[number];

type TierLevel = typeof tierLevels[number];

const tierConfig: Record<TierLevel, { color: string; bg: string; border: string }> = {
  Platinum: { color: '#e2e8f0', bg: 'rgba(226,232,240,0.12)', border: 'rgba(226,232,240,0.25)' },
  Gold:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  Silver:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  Bronze:   { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)' },
};

export function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CustomerCategory>('All');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') as CustomerCategory | null;
    if (category && categories.includes(category)) {
      setActiveCategory(category);
    }
  }, [location.search]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApi.list(search, 10000),
  });

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchTerm.trim());
  };

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

  const atRiskCustomers = useMemo(
    () => data?.customers?.filter((customer: { loyaltyTier: string; totalSpend: number }) =>
      customer.loyaltyTier === 'Bronze' && customer.totalSpend < 15000
    ) || [],
    [data?.customers]
  );

  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    if (activeCategory === 'All') return data.customers;
    if (activeCategory === 'At risk') return atRiskCustomers;
    return data.customers.filter((customer: { loyaltyTier: string }) => customer.loyaltyTier === activeCategory);
  }, [activeCategory, atRiskCustomers, data?.customers]);

  const totalCustomers = data?.total || 0;
  const activeCategoryLabel = activeCategory === 'All' ? 'All customers' : activeCategory === 'At risk' ? 'At risk customers' : `${activeCategory} tier`;

  return (
    <div className="space-y-6 slide-up">
      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
        <Card className="overflow-hidden bg-white/5 border border-white/10">
          <CardHeader className="gap-4 md:flex md:items-start md:justify-between md:gap-6">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                {totalCustomers.toLocaleString('en-IN')} contacts across India · {activeCategoryLabel}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import customers
                </Button>
              </label>
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportOrders} />
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import orders
                </Button>
              </label>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tierLevels.map((tier) => {
                const cfg = tierConfig[tier];
                const count = tierCounts[tier] || 0;
                const pct = totalCustomers ? Math.round((count / totalCustomers) * 100) : 0;
                const pctLabel = count > 0 && pct === 0 ? '<1%' : `${pct}%`;

                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === tier ? 'All' : tier)}
                    className="rounded-3xl border p-5 text-left transition hover:-translate-y-0.5"
                    style={{
                      background: activeCategory === tier ? cfg.bg : 'rgba(255,255,255,0.04)',
                      borderColor: activeCategory === tier ? cfg.border : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: cfg.color }}>
                        {tier}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Users className="h-4 w-4" style={{ color: cfg.color }} />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">{count.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-white/50 mt-1">{pctLabel} of total</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((category) => (
                  <NavLink
                    key={category}
                    to={`/customers?category=${encodeURIComponent(category)}`}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-11 items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition',
                        isActive
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-transparent text-white/60 hover:border-white/20 hover:bg-white/5 hover:text-white',
                      )
                    }
                  >
                    {category}
                  </NavLink>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.6fr_auto] items-center">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email"
                      className="pl-10 text-white"
                    />
                  </div>
                  <Button type="submit" size="sm">Search</Button>
                </form>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    <Filter className="h-4 w-4" />
                    Refresh
                  </Button>
                  {activeCategory !== 'All' && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveCategory('All')}>
                      Clear view
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Customer insight</CardTitle>
            <CardDescription>Quick snapshot of your current customer distribution and active tier filters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total contacts</p>
                <p className="mt-3 text-2xl font-semibold text-white">{totalCustomers.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Active tier</p>
                <p className="mt-3 text-xl font-semibold text-white">{activeCategory === 'All' ? 'All tiers' : activeCategory}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">At risk customers</p>
                <p className="mt-3 text-xl font-semibold text-white">{atRiskCustomers.length.toLocaleString('en-IN')}</p>
                <p className="text-xs text-white/50 mt-1">
                  Avg. spend ₹{Math.round(atRiskCustomers.reduce((sum, customer) => sum + customer.totalSpend, 0) / Math.max(atRiskCustomers.length, 1)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-white/5 border border-white/10">
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{activeCategoryLabel}</CardTitle>
            <CardDescription className="text-sm text-white/70">
              Showing {filteredCustomers.length.toLocaleString('en-IN')} customers in this category.
            </CardDescription>
          </div>
          <div className="text-right text-sm text-white/60">
            {activeCategory === 'At risk' ? `${atRiskCustomers.length.toLocaleString('en-IN')} at risk customers` : `${filteredCustomers.length.toLocaleString('en-IN')} customers`}
          </div>
        </CardHeader>
        <CardContent>
          <CustomerTable customers={filteredCustomers} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
