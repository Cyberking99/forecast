# Forecast 🔮

<p align="center">
  <img src="logo.png" alt="Forecast Logo" width="300" />
</p>

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

## 🍳 Hackathon Integrations & Dev Cook Off Alignment

This project is built explicitly for the **MetaMask Smart Accounts Kit x 1Shot API x Venice AI Dev Cook Off**:

### 1. MetaMask Smart Accounts Kit (Porto)
- **Account Abstraction**: Leverages the `porto` EIP-7702 testbed client to dynamically upgrade traditional EOAs into smart accounts on Base Sepolia.
- **Session Keys (ERC-7715)**: Implements gasless, popup-free staking by requesting a 7-day session key permission (`StakePanel.tsx`), eliminating recurring signature requests for subsequent stakes.
- **Atomic Batches (EIP-5792)**: Uses the `useSendCalls` hook to bundle USDC approvals and prediction pool stake actions into a single, seamless, and gasless transaction.

### 2. 1Shot API
- **Atomic Payouts**: Uses the 1Shot batching/sponsored relayer model to implement parimutuel pool payouts. The contract settlements trigger payouts for all winning stakers in a single batch, drastically reducing gas overhead and user friction.
- **Confirmation Webhooks**: Implements the 1Shot transaction confirmation webhooks (`/api/webhooks/1shot`) to dynamically track and update pending stakes and pool settlement statuses off-chain.

### 3. Venice AI
- **Autonomous Resolution**: The oracle agent (`oracle/src/worker.ts`) queries locked pools on-chain and uses Venice AI's private `llama-3.3-70b` LLM completions (`oracle/src/resolvePool.ts`) to scrape evidence and make deterministic resolutions.
- **Monetized AI Analysis (x402)**: Enables users to pay $0.50 USDC on-chain to unlock a dynamic prediction confidence and risk analysis report generated directly by Venice AI.

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

## 🛠️ Hackathon Track Requirements & Code Links

As required by the MetaMask DevRel and HackQuest guidelines, here are the code usage links for each integration category:

### 1. Smart Accounts Kit (Porto) & ERC-7715

- **Session Keys / Advanced Permissions (ERC-7715)**:
  - Requesting & Granting Session Permissions: [`StakePanel.tsx#L127-L157`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/features/staking/components/StakePanel.tsx#L127-L157)
  - Querying Existing Sessions: [`StakePanel.tsx#L48-L50`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/features/staking/components/StakePanel.tsx#L48-L50)
- **Atomic Batches (EIP-5792)**:
  - Bundling USDC Approvals and Stakes: [`StakePanel.tsx#L195-L215`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/features/staking/components/StakePanel.tsx#L195-L215)
- **Delegations / Redelegations**:
  - *Not used* (Not required for Forecast's parimutuel design).

### 2. x402 Protocol Micropayments

- **Server Gating**:
  - Validating incoming headers and proxying request: [`route.ts#L5-L20`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/app/api/analysis/route.ts#L5-L20)
- **Client Payment & Consumption**:
  - Triggering payment & parsing L402 challenge: [`AIAnalysisModal.tsx#L60-L115`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/features/analysis/components/AIAnalysisModal.tsx#L60-L115)

### 3. 1Shot API

- **Atomic Pool Settlements**:
  - Batch payouts inside the settlement contract logic: [`PredictionPool.sol#L230-L245`](https://github.com/Cyberking99/forecast/blob/main/contracts/src/PredictionPool.sol#L230-L245)
- **1Shot Webhook Integration**:
  - Syncing mined transaction payloads to off-chain DB: [`1shot/route.ts#L15-L123`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/app/api/webhooks/1shot/route.ts#L15-L123)

### 4. Venice AI

- **Oracle Worker Resolution Loop**:
  - Resolving locked pools and submitting signed on-chain verdicts: [`worker.ts#L35-L95`](https://github.com/Cyberking99/forecast/blob/main/oracle/src/worker.ts#L35-L95)
- **JSON Structured Prompting**:
  - Formatting deterministic LLM completion prompts: [`resolvePool.ts#L8-L45`](https://github.com/Cyberking99/forecast/blob/main/oracle/src/resolvePool.ts#L8-L45)
- **Sentiment & Forecast Analysis Generation**:
  - Serving user-requested premium analytical reports: [`route.ts#L33-L93`](https://github.com/Cyberking99/forecast/blob/main/frontend/src/app/api/analysis/route.ts#L33-L93)

---

## 💬 Developer Feedback

### MetaMask Smart Accounts Kit (Porto)
- **Praise**: The EIP-7702 EOA-upgrade capability is extremely clean. Getting gasless atomic batches through standard Wagmi config saves substantial development time.
- **Encountered Issues**:
  - **Porto issue #1034**: During browser testing, we noted that granted permissions are not automatically attached to `sendCalls` transactions within Porto's current beta. Users are still prompted with transaction signatures despite granting a session key.
  - **Iframe / Cross-Origin limitations**: Porto relies on WebAuthn and passkeys which are restricted in insecure origins (HTTP) or when embedded in iframes. For local setups, this requires enabling HTTPS or opening the dApp outside of framing containers to prevent credentials verification failures.

### 1Shot API
- **Praise**: The webhook listener design is great. It makes it incredibly straightforward to update PostgreSQL databases asynchronously once transactions are processed on-chain, keeping the UI instantly in sync.

### Venice AI
- **Praise**: Standard compliance with OpenAI endpoints makes integration seamless. Response generation was fast and structured outputs via standard JSON mode parsed without any failures during test runs.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
