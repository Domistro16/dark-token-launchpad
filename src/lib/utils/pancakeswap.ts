import { ethers } from "ethers";

export interface PancakeSwapStats {
  priceInBNB: number;
  priceInUSD: number;
  marketCapUSD: number;
  liquidityUSD: number;
  totalSupply: number;
  pairAddress: string;
}

export async function getTokenStats(
  tokenAddress: string,
  provider: any
): Promise<PancakeSwapStats> {
  const WBNB = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // BSC Testnet
  const FACTORY = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'; // Testnet
  
  // Get pair
  const factory = new ethers.Contract(
    FACTORY,
    ['function getPair(address,address) view returns (address)'],
    provider
  );
  
  const pairAddress = await factory.getPair(tokenAddress, WBNB);
  
  // Get reserves
  const pair = new ethers.Contract(pairAddress, [
    'function getReserves() view returns (uint112,uint112,uint32)',
    'function token0() view returns (address)'
  ], provider);
  
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  
  const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
  const tokenReserve = isToken0 ? reserve0 : reserve1;
  const wbnbReserve = isToken0 ? reserve1 : reserve0;
  
  // Calculate price
  const priceInBNB = Number(ethers.formatEther(wbnbReserve)) / 
                     Number(ethers.formatEther(tokenReserve));
  
  // Get total supply for market cap
  const token = new ethers.Contract(
    tokenAddress,
    ['function totalSupply() view returns (uint256)'],
    provider
  );
  const totalSupply = await token.totalSupply();
  const supply = Number(ethers.formatEther(totalSupply));
  
  // Get BNB price
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
  const data = await res.json();
  const bnbPrice = data.binancecoin.usd;
  
  const priceInUSD = priceInBNB * bnbPrice;
  const wbnbLiq = Number(ethers.formatEther(wbnbReserve));
  
  return {
    priceInBNB,
    priceInUSD,
    marketCapUSD: priceInUSD * supply,
    liquidityUSD: wbnbLiq * bnbPrice * 2,
    totalSupply: supply,
    pairAddress
  };
}
