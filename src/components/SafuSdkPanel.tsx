"use client";

import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SafuSdkPanel = () => {
  const { sdk, isInitializing, error, connect } = useSafuPadSDK();

  useEffect(() => {
    if (sdk) {
      // eslint-disable-next-line no-console
      console.log("SafuPad SDK initialized", sdk);
    }
  }, [sdk]);

  const [status, setStatus] = useState<string>("");

  // Common inputs
  const [tokenAddress, setTokenAddress] = useState("");

  // Trading inputs
  const [bnbAmount, setBnbAmount] = useState("0.01");
  const [tokenAmount, setTokenAmount] = useState("1000");

  // Creator/admin inputs
  const [infoFiWallet, setInfoFiWallet] = useState("");

  // Project Raise inputs
  const [prName, setPrName] = useState("MyToken");
  const [prSymbol, setPrSymbol] = useState("MTK");
  const [prSupply, setPrSupply] = useState("1000000000");
  const [prTargetUsd, setPrTargetUsd] = useState("50000");
  const [prMaxUsd, setPrMaxUsd] = useState("100000");
  const [prVestingDays, setPrVestingDays] = useState("180");
  const [prBurnLP, setPrBurnLP] = useState(false);

  // Instant Launch inputs
  const [ilName, setIlName] = useState("Instant");
  const [ilSymbol, setIlSymbol] = useState("INST");
  const [ilSupply, setIlSupply] = useState("1000000000");
  const [ilInitialBNB, setIlInitialBNB] = useState("0.05");
  const [ilBurnLP, setIlBurnLP] = useState(false);

  const [activeTokens, setActiveTokens] = useState<string[]>([]);

  const guard = () => {
    if (!sdk) {
      setStatus("SDK not ready. Connect wallet first.");
      return false;
    }
    return true;
  };

  const handleGetActiveTokens = async () => {
    if (!guard()) return;
    try {
      setStatus("Fetching active tokens...");
      const tokens = await sdk!.bondingDex.getActiveTokens();
      setActiveTokens(tokens);
      setStatus(`Found ${tokens.length} active tokens`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleGetBNBPrice = async () => {
    if (!guard()) return;
    try {
      setStatus("Fetching BNB price...");
      const price = await sdk!.priceOracle.getBNBPriceFormatted();
      setStatus(`BNB Price: ${price} USD`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleBuy = async () => {
    if (!guard()) return;
    try {
      setStatus("Buying tokens...");
      const tx = await sdk!.bondingDex.buyTokens(tokenAddress, bnbAmount);
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Buy confirmed: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleSell = async () => {
    if (!guard()) return;
    try {
      setStatus("Selling tokens...");
      const tx = await sdk!.bondingDex.sellTokens(tokenAddress, tokenAmount);
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Sell confirmed: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleClaimCreatorFees = async () => {
    if (!guard()) return;
    try {
      setStatus("Claiming creator fees...");
      const tx = await sdk!.bondingDex.claimCreatorFees(tokenAddress);
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Fees claimed: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleHarvestFees = async () => {
    if (!guard()) return;
    try {
      setStatus("Harvesting LP fees...");
      const tx = await sdk!.lpHarvester.harvestFees(tokenAddress);
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Harvest confirmed: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleGraduate = async () => {
    if (!guard()) return;
    try {
      setStatus("Graduating to PancakeSwap...");
      const tx = await sdk!.launchpad.graduateToPancakeSwap(tokenAddress);
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Graduation confirmed: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleCreateProjectRaise = async () => {
    if (!guard()) return;
    try {
      if (!infoFiWallet) {
        setStatus("Enter InfoFi wallet address");
        return;
      }
      setStatus("Creating Project Raise launch...");
      const tx = await sdk!.launchpad.createLaunch({
        name: prName,
        symbol: prSymbol,
        totalSupply: Number(prSupply),
        raiseTargetUSD: prTargetUsd,
        raiseMaxUSD: prMaxUsd,
        vestingDuration: Number(prVestingDays),
        metadata: {
          logoURI: "",
          description: `${prName} created via panel`,
          website: "",
          twitter: "",
          telegram: "",
          discord: "",
        },
        projectInfoFiWallet: infoFiWallet,
        burnLP: prBurnLP,
        vanitySalt: undefined,
      });
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Project Raise created: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  const handleCreateInstantLaunch = async () => {
    if (!guard()) return;
    try {
      setStatus("Creating Instant Launch...");
      const tx = await sdk!.launchpad.createInstantLaunch({
        name: ilName,
        symbol: ilSymbol,
        totalSupply: Number(ilSupply),
        metadata: {
          logoURI: "",
          description: `${ilName} instant launch via panel`,
          website: "",
          twitter: "",
          telegram: "",
          discord: "",
        },
        initialBuyBNB: ilInitialBNB,
        burnLP: ilBurnLP,
        vanitySalt: undefined,
      });
      setStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setStatus(`Instant Launch created: ${tx.hash}`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent/90">SafuPad SDK</p>
          {/* Network is locked to BSC Testnet */}
          <p className="text-xs text-accent/80">Network: BSC Testnet</p>
          {isInitializing && (
            <p className="text-xs text-muted-foreground">Initializing...</p>
          )}
          {!isInitializing && sdk && (
            <p className="text-xs text-muted-foreground">Ready</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{String((error as any)?.message || error)}</p>
          )}
          {status && (
            <p className="text-xs mt-2 text-accent/80 break-all">{status}</p>
          )}
        </div>
        <Button
          variant="default"
          className="controller-btn px-4 py-2"
          onClick={() => void connect()}
          disabled={!sdk || isInitializing}
        >
          {isInitializing ? "Please wait" : "Connect SDK"}
        </Button>
      </div>

      {/* Utilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-border/60 p-4">
          <p className="text-sm font-bold mb-3">Utilities</p>
          <div className="flex gap-2">
            <Button onClick={handleGetActiveTokens} disabled={!sdk} className="arcade-btn">List Active Tokens</Button>
            <Button onClick={handleGetBNBPrice} disabled={!sdk} variant="secondary" className="arcade-btn">BNB Price</Button>
          </div>
          {activeTokens.length > 0 && (
            <div className="mt-3 space-y-1">
              {activeTokens.slice(0, 5).map((t) => (
                <div key={t} className="text-xs text-muted-foreground break-all">{t}</div>
              ))}
              {activeTokens.length > 5 && (
                <div className="text-xxs text-muted-foreground">+ {activeTokens.length - 5} more</div>
              )}
            </div>
          )}
        </div>

        {/* Trading */}
        <div className="rounded-md border border-border/60 p-4">
          <p className="text-sm font-bold mb-3">Trading</p>
          <div className="space-y-2">
            <Input placeholder="Token address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="BNB amount (buy)" value={bnbAmount} onChange={(e) => setBnbAmount(e.target.value)} />
              <Input placeholder="Token amount (sell)" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleBuy} disabled={!sdk || !tokenAddress} className="arcade-btn">Buy</Button>
              <Button onClick={handleSell} disabled={!sdk || !tokenAddress} variant="secondary" className="arcade-btn">Sell</Button>
              <Button onClick={handleClaimCreatorFees} disabled={!sdk || !tokenAddress} variant="outline" className="arcade-btn">Claim Creator Fees</Button>
              <Button onClick={handleHarvestFees} disabled={!sdk || !tokenAddress} variant="outline" className="arcade-btn">Harvest LP</Button>
              <Button onClick={handleGraduate} disabled={!sdk || !tokenAddress} variant="destructive" className="arcade-btn">Graduate</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Launching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-border/60 p-4">
          <p className="text-sm font-bold mb-3">Create Project Raise</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={prName} onChange={(e) => setPrName(e.target.value)} />
              <Input placeholder="Symbol" value={prSymbol} onChange={(e) => setPrSymbol(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Total Supply" value={prSupply} onChange={(e) => setPrSupply(e.target.value)} />
              <Input placeholder="InfoFi Wallet" value={infoFiWallet} onChange={(e) => setInfoFiWallet(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Target USD" value={prTargetUsd} onChange={(e) => setPrTargetUsd(e.target.value)} />
              <Input placeholder="Max USD" value={prMaxUsd} onChange={(e) => setPrMaxUsd(e.target.value)} />
              <Input placeholder="Vesting (days)" value={prVestingDays} onChange={(e) => setPrVestingDays(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={prBurnLP} onChange={(e) => setPrBurnLP(e.target.checked)} />
              Burn LP
            </label>
            <Button onClick={handleCreateProjectRaise} disabled={!sdk} className="controller-btn px-4 py-2">Create Raise</Button>
          </div>
        </div>

        <div className="rounded-md border border-border/60 p-4">
          <p className="text-sm font-bold mb-3">Create Instant Launch</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={ilName} onChange={(e) => setIlName(e.target.value)} />
              <Input placeholder="Symbol" value={ilSymbol} onChange={(e) => setIlSymbol(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Total Supply" value={ilSupply} onChange={(e) => setIlSupply(e.target.value)} />
              <Input placeholder="Initial Buy BNB" value={ilInitialBNB} onChange={(e) => setIlInitialBNB(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={ilBurnLP} onChange={(e) => setIlBurnLP(e.target.checked)} />
              Burn LP
            </label>
            <Button onClick={handleCreateInstantLaunch} disabled={!sdk} className="controller-btn px-4 py-2">Create Instant</Button>
          </div>
        </div>
      </div>
    </div>
  );
};