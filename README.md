<div align="center">
  <img src="app/icon.svg" alt="WinScan Logo" width="120" height="120" />
  
  # WinScan - Multi-Chain Blockchain Explorer
  
  **Modern, feature-rich blockchain explorer for Cosmos ecosystem with EVM support**
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwinsnip-official%2Fwinscan.org)
  
  [![Website](https://img.shields.io/badge/Website-winsnip.xyz-blue?style=for-the-badge)](https://winsnip.xyz)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
  [![Twitter](https://img.shields.io/badge/Twitter-@winsnip-1DA1F2?style=for-the-badge)](https://twitter.com/winsnip)
  
  [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Supported Chains](#-supported-chains) • [Contributing](#-contributing)
  
</div>

---

## ✨ Features

### 🔍 Core Explorer
- **Real-time Blockchain Data** - Blocks, transactions, accounts with live updates
- **Validator Monitoring** - Uptime tracking, performance analytics, global node distribution
- **Governance System** - Vote on proposals directly from the explorer
- **Multi-Asset Support** - Track balances, holders, and token transfers

### ⚡ Advanced Capabilities
- **EVM Support** - Dual Cosmos + EVM explorer for hybrid chains (Shido, Uptick, Warden, XRPL)
- **IBC Cross-Chain** - Track IBC transfers, channels, and packet lifecycle
- **PRC20 Tokens** - Token verification, price charts, swap interface, liquidity pools
- **Developer Tools** - Endpoint checker, state sync generator, peer discovery

### 🤖 Automation Services
- **[Telegram Monitor Bot](https://t.me/winscan_monitor_bot)** - Validator alerts & governance notifications (32+ chains)
- **[IBC Relayer Service](ibc-relayer/)** - Automated packet relaying with web UI (35+ chains)
- **[Auto-Compound Bot](autocompound-bot/)** - Automated staking rewards compounding

### 🌍 User Experience
- **Multi-Language** - 7 languages (EN, ID, JP, KR, CN, ES, RU)
- **Wallet Integration** - Keplr, Leap, Cosmostation
- **Modern Dark UI** - Sleek, responsive, mobile-optimized
- **PWA Ready** - Installable Progressive Web App
- **Smart Caching** - 5-min cache with background refresh for optimal performance

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/winsnip-official/winscan.org.git
cd winscan.org

# Install dependencies
npm install

# Setup environment (optional - only if you have custom backend)
cp .env.example .env

# Run development server
npm run dev
```

Visit **http://localhost:3000**

### Available Scripts
```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Production server
npm run chain:add        # Add new chain interactively
npm run chain:validate   # Validate chain configs
```

### 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwinsnip-official%2Fwinscan.org)

**After deployment, configure environment variables:**

1. Go to **Project Settings** → **Environment Variables**
2. Add these variables (copy from `.env.example`):
   ```
   NEXT_PUBLIC_API_URL=https://ssl.winsnip.xyz
   NEXT_PUBLIC_API_URL_FALLBACK=https://ssl2.winsnip.xyz
   NEXT_PUBLIC_BACKEND_URL=https://ssl.winsnip.xyz
   NEXT_PUBLIC_API_TIMEOUT=8000
   NEXT_PUBLIC_DEFAULT_CHAIN=paxi-mainnet
   ```
3. Click **Save** and **Redeploy**

**Note:** If you don't have a custom backend, the app will automatically use RPC/API endpoints from chain configuration files.

📚 **[Homepage & Branding Guide](HOMEPAGE-CONFIG.md)** | **[Chain Configuration](CHAIN-GUIDELINES.md)**

---

## 📖 Documentation

### 🎨 Customization
- **[Homepage & Branding](HOMEPAGE-CONFIG.md)** - Configure homepage, loading screen, logo
- **[Chain Configuration](CHAIN-GUIDELINES.md)** - Add your blockchain to WinScan

### 🤖 Automation
- **[IBC Relayer](ibc-relayer/README.md)** - Automated IBC packet relaying
- **[Telegram Bot](telegram-monitor-bot/README.md)** - Real-time alerts
- **[Auto-Compound](autocompound-bot/README.md)** - Automated staking

### 🛠️ Contributing
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Security Policy](SECURITY.md)** - Report vulnerabilities
- **[Deployment Guide](.github/DEPLOYMENT.md)** - Deploy to production

---

## 💎 Supported Chains

<div align="center">

### 🌟 Mainnets (19 Chains)
AtomOne • Axone • BitBadges • CNHO Stables • CosmosHub • Gitopia • Humans.ai • Lava • Lumera • Noble • Osmosis • Paxi • **Shido ⚡** • Sunrise • Tellor • **Uptick ⚡** • **Warden ⚡** • **XRPL EVM ⚡** • Zenrock

### 🧪 Testnets (11 Chains)
AtomOne • CosmosHub • Empeiria • Kiichain • Lumera • Noble • Osmosis • Safrochain • Warden • XRPL EVM • Zenrock

**⚡ EVM Compatible** - Supports both Cosmos and EVM transactions with WebSocket real-time updates

</div>

🔗 **Want to add your chain?** See [CHAIN-GUIDELINES.md](CHAIN-GUIDELINES.md)

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14 • TypeScript • Tailwind CSS 4.x • React  
**Blockchain:** CosmJS • Cosmos SDK • ethers.js 6.x  
**Wallets:** Keplr • Leap • Cosmostation  
**Charts:** Recharts • Canvas API  
**Performance:** React Window • Custom caching strategies

---

## 🤝 Contributing

We welcome contributions! Whether fixing bugs, adding features, or improving docs.

**Quick Guide:**
1. Fork this repository
2. Create branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request to `dev` branch

⚠️ **Always target `dev` branch**, not `main`

📚 **Full guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Support & Community

| Platform | Link |
|----------|------|
| 🌐 Website | [winsnip.xyz](https://winsnip.xyz) |
| 🤖 Telegram Bot | [@winscan_monitor_bot](https://t.me/winscan_monitor_bot) |
| 💬 Telegram | [t.me/winsnip](https://t.me/winsnip) |
| 🐦 Twitter | [@winsnip](https://twitter.com/winsnip) |
| 💻 GitHub | [github.com/winsnip-official](https://github.com/winsnip-official) |
| 📧 Email | admin@winsnip.xyz |

---

## 📜 License

**© 2025 WinSnip Official. All Rights Reserved.**

Licensed under **MIT License with Additional Restrictions**.

✅ **Allowed:** Use, modify, distribute  
❌ **Prohibited:** Remove branding, claim as your own  
⚠️ **Required:** Maintain attribution to WinSnip

See [LICENSE](LICENSE) for full terms.

---

## 💖 Support the Project

[![Sponsor](https://img.shields.io/badge/Sponsor-WinScan-red?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/winsnip-official)

Your sponsorship helps us add more chains, improve performance, and develop new features!

---

<div align="center">

### Made with ❤️ by [WinSnip](https://winsnip.xyz)

**If you find this project useful, please give it a ⭐️**

[![Website](https://img.shields.io/badge/🌐-winsnip.xyz-blue?style=for-the-badge)](https://winsnip.xyz)
[![Twitter](https://img.shields.io/badge/🐦-@winsnip-1DA1F2?style=for-the-badge)](https://twitter.com/winsnip)
[![Telegram](https://img.shields.io/badge/💬-WinSnip-26A5E4?style=for-the-badge)](https://t.me/winsnip)

**Built on Trusted Infrastructure** | **Powered by Cosmos SDK** | **EVM Compatible**

</div>
