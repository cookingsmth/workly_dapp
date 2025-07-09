import { useState, useEffect } from 'react';

type SolPrice = {
  price: number;
  change24h: number;
};

const CompactSolPrice = () => {
  const [solPrice, setSolPrice] = useState<SolPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSolPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();

      if (data.solana) {
        setSolPrice({
          price: data.solana.usd,
          change24h: data.solana.usd_24h_change
        });
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-xl px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400 text-xs">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-6 z-50">
      <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-xl px-3 py-2 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-2">
          {/* SOL Icon */}
          <div className="w-4 h-4 flex-shrink-0">
            <img
              src="/solana.png"
              alt="SOL"
              className="w-4 h-4"
            />
          </div>

          {/* Price */}
          {solPrice && (
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-semibold text-sm">
                ${solPrice.price.toFixed(2)}
              </span>

              {/* Change indicator */}
              <div className={`text-xs ${solPrice.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                {solPrice.change24h >= 0 ? '↗' : '↘'} {Math.abs(solPrice.change24h).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Live indicator */}
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
};

export const MiniSolPrice = () => {
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolPrice(data.solana?.usd);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="bg-black/50 backdrop-blur rounded-lg px-2 py-1 border border-gray-700">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-orange-400">◉</span>
          <span className="text-white font-medium">
            ${typeof solPrice === 'number' ? solPrice.toFixed(2) : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};


export const TinySolPrice = () => {
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolPrice(data.solana?.usd);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-800/80 rounded-md px-2 py-1 text-xs text-green-400 font-mono border border-gray-600">
        ${typeof solPrice === 'number' ? solPrice.toFixed(2) : '---'}
      </div>
    </div>
  );
};

export default CompactSolPrice;