import { PoolCard } from "@/features/pools/components/PoolCard";
import { fetchOnChainPools } from "@/shared/lib/contracts";

export const revalidate = 0; // Disable Next.js page caching for real-time reads

export default async function Home() {
  const allPools = await fetchOnChainPools();

  // Group pools by status or show them in respective sections
  const trendingPools = allPools.filter(p => p.status === "open");
  const closedPools = allPools.filter(p => p.status !== "open");

  return (
    <>
      <nav className="filter-bar">
        <div className="filter-bar-inner">
          <button className="filter-chip active">All</button>
          <button className="filter-chip">Sports</button>
          <button className="filter-chip">Crypto</button>
          <button className="filter-chip">Politics</button>
          <button className="filter-chip">Culture</button>
          <button className="filter-chip">Tech</button>
        </div>
      </nav>

      <main className="app-main" data-pool-feed>
        {allPools.length === 0 ? (
          <div className="no-pools-card" style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--surface-card)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            marginTop: '24px'
          }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>No Prediction Pools Found</h3>
            <p>Run the seed script in the contracts workspace to populate prediction pools on your local node:</p>
            <code style={{
              display: 'block',
              background: 'var(--surface)',
              padding: '8px 12px',
              borderRadius: '6px',
              marginTop: '12px',
              color: 'var(--accent)',
              fontSize: '13px'
            }}>npx -w contracts hardhat run scripts/seed.js --network localhost</code>
          </div>
        ) : (
          <>
            {/* Active Pools */}
            {trendingPools.length > 0 && (
              <section className="category-section">
                <div className="category-section-header">
                  <span className="trending-dot"></span>
                  <h2>Active Pools</h2>
                </div>
                <div className="section-grid section-grid-2">
                  {trendingPools.map((pool) => (
                    <PoolCard key={pool.id} {...pool} />
                  ))}
                </div>
              </section>
            )}

            {/* Closed & Resolved Pools */}
            {closedPools.length > 0 && (
              <section className="category-section" style={{ marginTop: "32px" }}>
                <div className="category-section-header">
                  <h2>Closed & Resolved</h2>
                  <span style={{ color: "var(--amber)", fontSize: "12px", fontWeight: 600 }}>·</span>
                </div>
                <div className="section-grid section-grid-2">
                  {closedPools.map((pool) => (
                    <PoolCard key={pool.id} {...pool} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
