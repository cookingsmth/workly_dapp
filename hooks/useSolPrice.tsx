// hooks/useSolPrice.tsx
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface SolPriceData {
  price: number;
  change24h: number;
  isLoading: boolean;
  error: string | null;
}

export const useSolPrice = (refreshInterval: number = 30000): SolPriceData => {
  const [solPrice, setSolPrice] = useState<number>(0);
  const [change24h, setChange24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSolPrice = async () => {
    try {
      setError(null);
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch SOL price');
      }
      
      const data = await response.json();
      
      if (data.solana) {
        setSolPrice(data.solana.usd);
        setChange24h(data.solana.usd_24h_change || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching SOL price:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSolPrice();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchSolPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    price: solPrice,
    change24h,
    isLoading,
    error
  };
};

// Утилитарная функция для форматирования цены в USD
export const formatSolToUSD = (solAmount: number, solPrice: number): string => {
  const usdValue = solAmount * solPrice;
  
  if (usdValue >= 1000000) {
    return `$${(usdValue / 1000000).toFixed(1)}M`;
  } else if (usdValue >= 1000) {
    return `$${(usdValue / 1000).toFixed(1)}k`;
  } else if (usdValue >= 100) {
    return `$${usdValue.toFixed(0)}`;
  } else {
    return `$${usdValue.toFixed(2)}`;
  }
};

interface SolPriceContextType {
  price: number;
  change24h: number;
  isLoading: boolean;
  formatToUSD: (solAmount: number) => string;
}

const SolPriceContext = createContext<SolPriceContextType | undefined>(undefined);

export const SolPriceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { price, change24h, isLoading } = useSolPrice();

  const formatToUSD = (solAmount: number): string => {
    return formatSolToUSD(solAmount, price);
  };

  return (
    <SolPriceContext.Provider value={{ price, change24h, isLoading, formatToUSD }}>
      {children}
    </SolPriceContext.Provider>
  );
};

export const useSolPriceContext = (): SolPriceContextType => {
  const context = useContext(SolPriceContext);
  if (!context) {
    throw new Error('useSolPriceContext must be used within SolPriceProvider');
  }
  return context;
};