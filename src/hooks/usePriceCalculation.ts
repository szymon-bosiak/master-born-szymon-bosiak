// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Configuration,
  Product,
  PriceBreakdown,
  PriceResponse,
} from '../components/ProductConfigurator/types';
import { calculatePrice } from '../services/api';

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for managing price calculation
 */
export function usePriceCalculation(
  config: Configuration | null,
  product: Product,
): UsePriceCalculationResult {
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [formattedTotal, setFormattedTotal] = useState<string>('$0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track latest request timestamp to prevent stale responses from overwriting newer ones.
  // Guards against race conditions when the user changes options in rapid succession.
  const latestRequestRef = useRef<number>(0);

  const fetchPrice = useCallback(async () => {
    if (!config) {
      setPrice(null);
      setFormattedTotal('$0.00');
      return;
    }

    setIsLoading(true);
    setError(null);

    const requestTime = Date.now();
    latestRequestRef.current = requestTime;

    try {
      const response: PriceResponse = await calculatePrice(config, product);

      if (response.timestamp >= latestRequestRef.current) {
        setPrice(response.breakdown);
        setFormattedTotal(response.formattedTotal);
      }
    } catch {
      // Only set error if this is still the latest request
      if (requestTime === latestRequestRef.current) {
        setError('ERR_PRICE_CALC_FAILED');
        setPrice(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [config, product]);

  // Fetch price when config changes
  useEffect(() => {
    // TODO(CFG-142): temporary - removed together with the price fix in the next commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrice();
  }, [config?.selections, config?.addOns, config?.quantity]);

  return {
    price,
    formattedTotal,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}
