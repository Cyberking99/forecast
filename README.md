# Forecast 🔮

Forecast is a decentralized, multi-sided parimutuel prediction pool platform. Users stake USDC on different outcome options for real-world questions, and the winning side shares the losing pool proportionally to their stake. 

The project leverages cutting-edge Web3 and AI tools, including the **MetaMask Smart Accounts Kit** (EIP-7702 & ERC-7715), **1Shot API**, **Venice AI**, and the **x402 Protocol**.

---

## 🚀 Deployed Contracts (Base Sepolia)

- **USDC Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **OracleVerifier**: `0x3Da178f34790964cA697599a829E949Dd55152AB`
- **FeeCollector**: `0x47D190ed0bBcD757765a0A3862535D68BF000cF5`
- **PredictionPool**: `0x6096b6892F13F74495c3499a7CE21321fD971e33`
- **SessionKeyModule**: `0xE1Ec695acdeDF0844808e106C38498c5dAbA2434`

---

## 🚀 Key Features & Tech Stack

- **Solidity Smart Contracts (Base Sepolia)**: Parimutuel pool logic, oracle verification (`OracleVerifier.sol`), and session key constraints (`SessionKeyModule.sol`).
- **MetaMask Smart Accounts Kit**: Upgrades EOAs to Smart Accounts via EIP-7702 and requests ERC-7715 session keys to enable gasless, popup-free staking.
- **1Shot API**: Relays gasless stakes and executes batch settlements (all winning stakers are paid out in a single transaction).
- **Venice AI Oracle**: A private, decentralized LLM oracle agent that resolves prediction outcomes deterministically and generates sentiment analysis reports.
- **x402 Protocol**: Micropayment gating that allows users to unlock premium Venice AI analysis reports for $0.50 USDC.
- **Next.js 14 App Router**: A high-performance web interface designed for precise, high-density financial decisions.

---

## 📁 Repository Structure

```
├── contracts/             # Hardhat smart contract workspace
│   ├── src/               # Solidity contract files (PredictionPool, OracleVerifier, etc.)
│   ├── test/              # Ethers.js unit tests
│   └── hardhat.config.ts  # Compiler (viaIR enabled) and network settings
├── frontend/              # Next.js 14 App Router workspace
│   ├── src/app/           # App routes and providers
│   ├── src/features/      # Staking, analysis, and pool components
│   └── src/shared/        # Shared UI and Wagmi/Viem configuration
├── oracle/                # Venice AI Oracle worker service
│   ├── src/resolvePool.ts # Venice AI resolution prompting and API
│   └── src/worker.ts      # Polling loops and oracle signing
├── docs/                  # Technical design specs and implementation plans
└── prototype-design/      # High-fidelity static HTML/CSS mockup gallery
```

---

## 🛠️ Getting Started

### 1. Installation

Install dependencies for all workspaces from the project root:

```bash
npm install
```

---

### 2. Environment Configuration

Create a `.env` file in the root directory and populate it with the relevant variables:

```bash
# Contracts
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
ORACLE_ADDRESS=your_oracle_signer_address
ORACLE_PRIVATE_KEY=your_oracle_private_key
ONESHOT_RELAYER_ADDRESS=your_oneshot_relayer_address

# API Keys
ONESHOT_API_KEY=your_oneshot_api_key
ONESHOT_WEBHOOK_SECRET=your_oneshot_webhook_secret
VENICE_API_KEY=your_venice_api_key
DATABASE_URL=postgresql://user:pass@localhost:5432/forecaster
```

---

### 3. Deploying & Testing Smart Contracts

#### Running tests locally (against Anvil):
To run tests safely, we use an active local **Anvil** node:

1. **Start Anvil** in a separate terminal:
   ```bash
   anvil
   ```

2. **Run Tests** against the local node:
   ```bash
   npm run test:contracts -- --network localhost
   ```

#### Deploying Contracts:
To deploy the contracts to the local network or Base Sepolia testnet:

```bash
# Deploy to Local Anvil
npx -w contracts hardhat run scripts/deploy.ts --network localhost

# Deploy to Base Sepolia
npx -w contracts hardhat run scripts/deploy.ts --network baseSepolia
```

#### Seeding Pools (Localhost):
To seed two initial prediction pools and mock stakes for testing:

```bash
npx -w contracts hardhat run scripts/seed.js --network localhost
```

#### Syncing ABIs to Frontend:
To export contract ABIs and generated addresses directly to the frontend application:

```bash
node contracts/scripts/export-contracts.js
```

---

### 4. Running the Venice AI Oracle Agent

Start the oracle worker that polls for locked pools and resolves them using Venice AI:

```bash
npm run dev:oracle
```

---

### 5. Running the Frontend

Start the Next.js development server:

```bash
npm run dev
```

The web app will be accessible at [http://localhost:3000](http://localhost:3000).

---

### 6. Building for Production

Compile and build the Next.js bundle:

```bash
npm run build
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
