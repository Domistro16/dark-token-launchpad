# InfoFi Token Launchpad

A modern, dark-themed token launchpad platform built with Next.js 15, TypeScript, and Tailwind CSS. Launch tokens on BSC with two powerful models: Project Raise and Instant Launch.

![InfoFi Launch](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop)

## 🚀 Features

### Two Launch Models

#### **Project Raise**
- Raise $50k-$500k over 24 hours
- 20% owner allocation (10% immediate, 10% vested over 6 months)
- 10% liquidity pool (capped at $100k)
- 1% trading fee split: 0.1% platform, 0.3% academy, 0.6% InfoFi
- Graduate to PancakeSwap at $500k market cap
- Anti-dump mechanism: tokens burned if release would drop market cap
- Requires admin approval

#### **Instant Launch**
- Deploy and trade immediately
- 2% trading fee split: 0.1% platform, 1.0% creator, 0.9% InfoFi
- Graduate at 15 BNB cumulative buys
- Creator claims fees every 24h (if market cap maintained)
- Tweet-bot integration for auto-creation
- No approval required

### Platform Features

- **Trading Interface**: Built-in DEX for token trading
- **Vesting Timeline**: Visual representation of token releases
- **InfoFi Dashboards**: Dedicated dashboard for each token
- **Creator Claims**: Easy fee claiming with cooldown management
- **Admin Panel**: Review and approve Project Raise submissions
- **Portfolio Tracking**: Monitor holdings and P&L
- **Responsive Design**: Mobile-first dark theme with #FFB000 branding

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI components
- **Wallet**: RainbowKit, wagmi, viem
- **Blockchain**: BSC (Binance Smart Chain)
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Charts**: Recharts
- **Date**: date-fns

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/infofi-launch.git
cd infofi-launch

# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=56
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed1.binance.org

# Contract Addresses
NEXT_PUBLIC_PLATFORM_WALLET=0x...
NEXT_PUBLIC_ACADEMY_WALLET=0x...
NEXT_PUBLIC_INFOFI_WALLET=0x...

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# API Keys (optional)
NEXT_PUBLIC_BSCSCAN_API_KEY=your_api_key
```

See `.env.example` for all available options.

## 📁 Project Structure

```
infofi-launch/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── create/            # Token creation
│   │   ├── token/[id]/        # Token detail pages
│   │   ├── portfolio/         # User portfolio
│   │   └── admin/             # Admin panel
│   ├── components/            # React components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── PlatformMetrics.tsx
│   │   ├── TokenCard.tsx
│   │   ├── TokenFilters.tsx
│   │   ├── create/            # Creation modals
│   │   ├── token/             # Token detail components
│   │   └── ui/                # Shadcn/UI components
│   ├── types/                 # TypeScript types
│   │   └── token.ts
│   ├── lib/                   # Utilities
│   │   ├── mockData.ts        # Sample data
│   │   └── utils/
│   │       └── format.ts      # Formatting utilities
│   └── hooks/                 # Custom React hooks
├── contracts/                 # Smart contracts
│   ├── ProjectRaiseToken.sol
│   └── InstantLaunchToken.sol
├── public/                    # Static assets
└── README.md
```

## 🎨 Design System

### Brand Colors
- **Primary**: `#FFB000` (Gold/Orange)
- **Background**: `#000000` (Black)
- **Card**: `#0a0a0a` (Near Black)
- **Border**: `rgba(255, 176, 0, 0.2)`

### Typography
- **Headings**: Bold, -0.02em letter spacing
- **Body**: Geist Sans
- **Code**: Geist Mono

## 🔐 Smart Contracts

### ProjectRaiseToken.sol
Features:
- ERC20 token with vesting
- Fundraising mechanism
- Anti-dump protection
- Fee distribution
- Market cap tracking

### InstantLaunchToken.sol
Features:
- ERC20 token
- Instant deployment
- Dynamic fee collection
- Graduation tracking
- Creator rewards

See `DEPLOYMENT.md` for deployment instructions.

## 📊 Key Pages

### Landing Page (`/`)
- Platform metrics dashboard
- Token grid with filters
- Real-time updates
- Quick actions

### Create Token (`/create`)
- Choose launch type
- Feature comparison
- Step-by-step forms
- Validation

### Token Detail (`/token/[id]`)
- Trading interface
- Price chart
- Vesting timeline
- Trade history
- Social links

### Portfolio (`/portfolio`)
- Holdings overview
- P&L tracking
- Claimable fees
- Claim history

### Admin Panel (`/admin`)
- Pending approvals
- Review submissions
- Approve/reject tokens
- Admin statistics

## 🚦 Roadmap

- [x] Core UI and components
- [x] Project Raise flow
- [x] Instant Launch flow
- [x] Admin panel
- [x] Portfolio tracking
- [x] Smart contract templates
- [ ] RainbowKit full integration
- [ ] Real blockchain integration
- [ ] Price oracles (Chainlink)
- [ ] Chart/analytics
- [ ] Tweet-bot API
- [ ] Unit tests
- [ ] E2E tests
- [ ] Mainnet deployment

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://infofi.io
- **Twitter**: https://twitter.com/infofi
- **Telegram**: https://t.me/infofi
- **Discord**: https://discord.gg/infofi
- **Docs**: https://docs.infofi.io

## 💬 Support

For support, email support@infofi.io or join our Telegram group.

## ⚠️ Disclaimer

This is demo software for educational purposes. Always conduct thorough audits before deploying smart contracts to mainnet. Use at your own risk.

---

Built with ❤️ by the InfoFi Team