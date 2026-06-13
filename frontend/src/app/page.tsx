import { PoolCard } from "@/features/pools/components/PoolCard";
import { fetchOnChainPools } from "@/shared/lib/contracts";

export const revalidate = 0; // Disable Next.js page caching for real-time reads

export default async function Home() {
  const allPools = await fetchOnChainPools();

  // Sort pools by total pool size (descending) so the largest pool is featured
  const sortedPools = [...allPools].sort((a, b) => {
    const aVal = parseFloat(a.poolTotal.replace(/[^0-9.]/g, "")) || 0;
    const bVal = parseFloat(b.poolTotal.replace(/[^0-9.]/g, "")) || 0;
    return bVal - aVal;
  });

  const featuredPool = sortedPools[0];
  const remainingPools = sortedPools.slice(1);

  // Chunk remaining pools into pairs of 2 for the asymmetric grid rows
  const poolPairs: typeof remainingPools[] = [];
  for (let i = 0; i < remainingPools.length; i += 2) {
    poolPairs.push(remainingPools.slice(i, i + 2));
  }

  return (
    <>
      <nav className="filter-bar">
        <button className="filter-chip active">ALL MARKETS</button>
        <button className="filter-chip">SPORTS</button>
        <button className="filter-chip">CRYPTO</button>
        <button className="filter-chip">POLITICS</button>
        <button className="filter-chip">TECH</button>
      </nav>

      <main className="app-main" style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
        
        {allPools.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 32px", border: "2px solid var(--border)", background: "var(--surface)" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>NO PREDICTION POOLS FOUND</h3>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
              Please run the seed script to deploy prediction pools on your local network.
            </p>
            <code style={{ display: "block", background: "var(--bg)", padding: "12px", border: "1px solid var(--border)", fontSize: "11px", color: "var(--accent)" }}>
              npx -w contracts hardhat run scripts/seed.js --network localhost
            </code>
          </div>
        ) : (
          <div className="asymmetric-feed">
            {/* Featured Pool (Full Width) */}
            {featuredPool && (
              <div className="featured-row">
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
                  ★ FEATURED PREDICTION
                </div>
                <PoolCard {...featuredPool} featured={true} />
              </div>
            )}

            {/* Asymmetric Grid Rows */}
            {poolPairs.map((pair, idx) => (
              <div key={idx} className="grid-row">
                {pair.map((pool) => (
                  <PoolCard key={pool.id} {...pool} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Type Specimen Section (Deliverable requirement) */}
        <section style={{ marginTop: "48px", borderTop: "2px solid var(--border)", paddingTop: "48px" }}>
          <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", marginBottom: "24px", fontFamily: "var(--font-mono)" }}>
            SYSTEM TYPE SPECIMEN
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            {/* Display typography */}
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "16px", fontFamily: "var(--font-mono)" }}>
                DISPLAY TYPEFACE: SYNE (800 WEIGHT ONLY)
              </div>
              <h1 style={{ fontSize: "46px", marginBottom: "16px" }}>DISPLAY HERO H1</h1>
              <h2 style={{ fontSize: "32px", marginBottom: "12px" }}>SUB-HEADER H2</h2>
              <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>CARD TITLE H3</h3>
            </div>

            {/* Monospace typography */}
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "16px", fontFamily: "var(--font-mono)" }}>
                DATA & PROSE TYPEFACE: SPACE MONO (400 WEIGHT)
              </div>
              <p style={{ fontSize: "14px", lineHeight: "1.7", marginBottom: "16px" }}>
                Prose, telemetry tables, odds listings, and ledger transactions are set in Space Mono for maximum numeric alignment. We avoid intermediate weight categories (e.g. 500, 600) to maintain high visual contrast.
              </p>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--accent)" }}>
                TABULAR NUMBERS: $2,835.00 USDC (62% POOL SHARE)
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
