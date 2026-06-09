# Forecast 🔮

Forecast is a decentralized, multi-sided parimutuel prediction pool platform. Users stake USDC on different outcome options for real-world questions, and the winning side shares the losing pool proportionally to their stake. 

The project leverages cutting-edge Web3 and AI tools, including the **MetaMask Smart Accounts Kit** (EIP-7702 & ERC-7715), **1Shot API**, **Venice AI**, and the **x402 Protocol**.

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

### 2. Testing Contracts

Hardhat's default EDR (Ethereum Development Runtime) can cause native crashes (Bus errors) on some virtualized Linux systems. To run the tests safely, we run them against a local **Anvil** node:

1. **Start Anvil** in a separate terminal:
   ```bash
   anvil
   ```

2. **Run Tests** against the local node:
   ```bash
   npm run test:contracts -- --network localhost
   ```

### 3. Running the Frontend

Start the Next.js development server:

```bash
npm run dev
```

The web app will be accessible at [http://localhost:3000](http://localhost:3000).

### 4. Building for Production

Compile and build the Next.js bundle:

```bash
npm run build
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
