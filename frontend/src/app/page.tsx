import { PoolCard } from "@/features/pools/components/PoolCard";

const TRENDING_POOLS = [
  {
    id: "1",
    question: "Will Real Madrid win the 2026 Champions League final?",
    category: "Sports",
    status: "open" as const,
    thumbnailUrl: "https://picsum.photos/seed/sports1/176/132",
    poolTotal: "$201.0K",
    timeLeft: "14d 6h",
    totalStakers: 715,
    options: [
      { label: "Yes", percentage: 62, totalStakedStr: "$124.8K", stakers: 431 },
      { label: "No", percentage: 38, totalStakedStr: "$76.2K", stakers: 284 },
    ],
  },
  {
    id: "2",
    question: "Will Solana surpass $500 before July 2026?",
    category: "Crypto",
    status: "open" as const,
    thumbnailUrl: "https://picsum.photos/seed/crypto1/176/132",
    poolTotal: "$128.3K",
    timeLeft: "38d 2h",
    totalStakers: 511,
    options: [
      { label: "Yes", percentage: 44, totalStakedStr: "$56.2K", stakers: 213 },
      { label: "No", percentage: 56, totalStakedStr: "$72.1K", stakers: 298 },
    ],
  },
];

const CLOSING_SOON_POOLS = [
  {
    id: "3",
    question: "Will the Fed cut rates at the June 2026 meeting?",
    category: "Politics",
    status: "open" as const,
    thumbnailUrl: "https://picsum.photos/seed/politics1/176/132",
    poolTotal: "$296.5K",
    timeLeft: "2h 45m",
    totalStakers: 1237,
    options: [
      { label: "Yes", percentage: 71, totalStakedStr: "$210.4K", stakers: 892 },
      { label: "No", percentage: 29, totalStakedStr: "$86.1K", stakers: 345 },
    ],
  },
  {
    id: "4",
    question: "Will the new Christopher Nolan film gross over $800M globally?",
    category: "Culture",
    status: "open" as const,
    thumbnailUrl: "https://picsum.photos/seed/film1/176/132",
    poolTotal: "$52.3K",
    timeLeft: "6h 20m",
    totalStakers: 266,
    options: [
      { label: "Yes", percentage: 35, totalStakedStr: "$18.3K", stakers: 94 },
      { label: "No", percentage: 65, totalStakedStr: "$34.0K", stakers: 172 },
    ],
  },
];

export default function Home() {
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
        {/* Trending */}
        <section className="category-section">
          <div className="category-section-header">
            <span className="trending-dot"></span>
            <h2>Trending</h2>
          </div>
          <div className="section-grid section-grid-2">
            {TRENDING_POOLS.map((pool) => (
              <PoolCard key={pool.id} {...pool} />
            ))}
          </div>
        </section>

        {/* Closing Soon */}
        <section className="category-section" style={{ marginTop: "32px" }}>
          <div className="category-section-header">
            <h2>Closing Soon</h2>
            <span style={{ color: "var(--amber)", fontSize: "12px", fontWeight: 600 }}>·</span>
          </div>
          <div className="section-grid section-grid-2">
            {CLOSING_SOON_POOLS.map((pool) => (
              <PoolCard key={pool.id} {...pool} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
