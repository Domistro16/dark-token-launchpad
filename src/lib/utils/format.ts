// For market cap and large USD amounts
export function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return "$0.00";
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  
  return `$${value.toFixed(2)}`;
}



// For percentages
export function formatPercent(value: number): string {
  if (!value || isNaN(value)) return "0%";
  
  // Large percentages
  if (Math.abs(value) >= 100) {
    return `${value.toFixed(0)}%`;
  }
  
  // Regular percentages
  if (Math.abs(value) >= 0.01) {
    return `${value.toFixed(2)}%`;
  }
  
  // Very small percentages
  return `${value.toFixed(4)}%`;
}

// For token amounts
export function formatTokenAmount(value: number, maxDecimals: number = 6): string {
  if (!value || isNaN(value)) return "0";
  
  // Large amounts
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  
  // Small amounts - use dynamic decimals
  if (value >= 1) {
    return value.toFixed(2);
  }
  
  // Very small amounts
  if (value > 0) {
    // Find first non-zero decimal
    const str = value.toString();
    const decimals = Math.min(maxDecimals, str.length);
    return value.toFixed(decimals);
  }
  
  return "0";
}
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

export function formatPrice(value: number): string {
  if (!value || isNaN(value) || value === 0) return "$0.00";
  
  const absValue = Math.abs(value);
  
  // For prices >= $1
  if (absValue >= 1) {
    return `$${value.toFixed(2)}`;
  }
  
  // For very small prices, show only 2 significant digits
  // Example: 0.0000000004094 → 0.00000000041
  const str = absValue.toExponential();
  const [mantissa, exponent] = str.split('e');
  const exp = parseInt(exponent, 10);
  
  // Calculate number of zeros after decimal point
  const zerosAfterDecimal = Math.abs(exp) - 1;
  
  // Round to 2 significant digits
  const significantDigits = parseFloat(mantissa).toFixed(1);
  const roundedValue = parseFloat(significantDigits) * Math.pow(10, exp);
  
  // Format with appropriate decimal places (zeros + 2 significant digits)
  const decimalPlaces = zerosAfterDecimal + 2;
  return `$${roundedValue.toFixed(decimalPlaces)}`;
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "Ended";
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

export function getProgressPercentage(current: number, target: number): number {
  return Math.min((current / target) * 100, 100);
}