# Deployment Guide

This guide covers deploying the InfoFi Token Launchpad to production.

## Prerequisites

- Node.js 18+ or Bun
- BSC wallet with BNB for gas
- WalletConnect Project ID
- Domain name (optional)
- Vercel/Netlify account (for frontend)

## Smart Contract Deployment

### 1. Setup Hardhat

```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npx hardhat
```

### 2. Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    bscTestnet: {
      url: "https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97,
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 56,
    },
  },
};
```

### 3. Deploy Factory Contracts

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  // Deploy Project Raise Factory
  const ProjectRaiseFactory = await hre.ethers.getContractFactory("ProjectRaiseTokenFactory");
  const projectRaiseFactory = await ProjectRaiseFactory.deploy(
    process.env.PLATFORM_WALLET,
    process.env.ACADEMY_WALLET,
    process.env.INFOFI_WALLET
  );
  await projectRaiseFactory.deployed();
  console.log("ProjectRaiseFactory deployed to:", projectRaiseFactory.address);

  // Deploy Instant Launch Factory
  const InstantLaunchFactory = await hre.ethers.getContractFactory("InstantLaunchTokenFactory");
  const instantLaunchFactory = await InstantLaunchFactory.deploy(
    process.env.PLATFORM_WALLET,
    process.env.INFOFI_WALLET
  );
  await instantLaunchFactory.deployed();
  console.log("InstantLaunchFactory deployed to:", instantLaunchFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Deploy:
```bash
# Testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Mainnet
npx hardhat run scripts/deploy.js --network bsc
```

### 4. Verify Contracts

```bash
npx hardhat verify --network bsc CONTRACT_ADDRESS "CONSTRUCTOR_ARGS"
```

## Frontend Deployment

### 1. Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 2. Environment Variables

Add these in Vercel dashboard:

```env
NEXT_PUBLIC_CHAIN_ID=56
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed1.binance.org
NEXT_PUBLIC_PLATFORM_WALLET=0x...
NEXT_PUBLIC_ACADEMY_WALLET=0x...
NEXT_PUBLIC_INFOFI_WALLET=0x...
NEXT_PUBLIC_PROJECT_RAISE_FACTORY=0x...
NEXT_PUBLIC_INSTANT_LAUNCH_FACTORY=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

### 3. Custom Domain

In Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records:
   - Type: CNAME
   - Name: launch (or @)
   - Value: cname.vercel-dns.com

### 4. Build Optimization

Update `next.config.ts`:

```typescript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    // ... other env vars
  },
};
```

## Post-Deployment Checklist

### Security

- [ ] Audit smart contracts
- [ ] Enable rate limiting
- [ ] Setup monitoring (Sentry, LogRocket)
- [ ] Configure CSP headers
- [ ] Enable HTTPS
- [ ] Setup backup RPC endpoints
- [ ] Configure multi-sig wallet for admin

### Testing

- [ ] Test wallet connection
- [ ] Test token creation (both models)
- [ ] Test trading interface
- [ ] Test claiming process
- [ ] Test admin approval flow
- [ ] Test on mobile devices
- [ ] Load testing

### Analytics

- [ ] Setup Google Analytics
- [ ] Setup Mixpanel/Amplitude
- [ ] Configure error tracking
- [ ] Setup uptime monitoring
- [ ] Configure blockchain event indexing

### Marketing

- [ ] Update social links
- [ ] Create announcement post
- [ ] Update documentation
- [ ] Create tutorial videos
- [ ] Setup customer support

## Monitoring

### Contract Events

Monitor these events:
- RaiseStarted
- ContributionReceived
- TokensGraduated
- CreatorFeeClaimed
- FeeCollected

### Alerts

Setup alerts for:
- Contract failures
- High gas prices
- Large transactions
- Failed deployments
- API errors

### Metrics

Track:
- Total tokens launched
- Total value locked
- Trading volume
- Active users
- Graduation rate

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check platform metrics
   - Review pending approvals
   - Monitor fee pools
   - Check error logs

2. **Monthly**
   - Audit new tokens
   - Review fee distributions
   - Update documentation
   - Security review

3. **Quarterly**
   - Smart contract audit
   - Performance optimization
   - Feature updates
   - User feedback review

### Upgrades

For contract upgrades:
1. Deploy new version
2. Test thoroughly
3. Pause old contracts
4. Migrate data
5. Update frontend
6. Announce changes

## Rollback Plan

If issues occur:

1. **Frontend Issues**
   ```bash
   # Rollback in Vercel
   vercel rollback
   ```

2. **Contract Issues**
   - Pause contracts (if pausable)
   - Deploy hotfix
   - Notify users
   - Resume operations

3. **Data Issues**
   - Restore from backup
   - Verify integrity
   - Sync blockchain state
   - Resume operations

## Support

For deployment issues:
- Email: devops@infofi.io
- Telegram: @infofi_support
- Discord: #technical-support

---

Last updated: 2024