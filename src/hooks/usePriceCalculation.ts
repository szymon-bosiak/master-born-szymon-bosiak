// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useEffectEvent, useCallback } from 'react';
import type {
  Configuration,
  Product,
  PriceBreakdown,
} from '../components/ProductConfigurator/types';
import { calculatePrice } from '../services/api';

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// The parts of a configuration that affect the price.
type PricingInputs = Pick<Configuration, 'selections' | 'addOns' | 'quantity'>;

interface PriceResult {
  // What this result was calculated for, so we can tell whether it is still current.
  inputs: PricingInputs;
  refetchId: number;
  price: PriceBreakdown | null;
  formattedTotal: string;
  error: string | null;
}

/**
 * Custom hook for managing price calculation
 */
export function usePriceCalculation(
  config: Configuration | null,
  product: Product,
): UsePriceCalculationResult {
  const [result, setResult] = useState<PriceResult | null>(null);
  const [refetchId, setRefetchId] = useState(0);

  const selections = config?.selections;
  const addOns = config?.addOns;
  const quantity = config?.quantity;

  // Reads the latest config inside the effect without making fields that don't affect
  // the price (e.g. the draft name) a dependency, so typing a name doesn't refetch.
  const getConfig = useEffectEvent(() => config);

  useEffect(() => {
    const requestConfig = getConfig();
    if (!requestConfig) return;

    // Responses can arrive out of order. Cleanup marks this request as stale as soon as
    // the inputs change (or the component unmounts), so only the latest response is applied.
    let isStale = false;
    const inputs: PricingInputs = {
      selections: requestConfig.selections,
      addOns: requestConfig.addOns,
      quantity: requestConfig.quantity,
    };

    calculatePrice(requestConfig, product).then(
      (response) => {
        if (isStale) return;
        setResult({
          inputs,
          refetchId,
          price: response.breakdown,
          formattedTotal: response.formattedTotal,
          error: null,
        });
      },
      () => {
        if (isStale) return;
        setResult((previous) => ({
          inputs,
          refetchId,
          price: null,
          formattedTotal: previous?.formattedTotal ?? '$0.00',
          error: 'ERR_PRICE_CALC_FAILED',
        }));
      },
    );

    return () => {
      isStale = true;
    };
  }, [selections, addOns, quantity, product, refetchId]);

  const refetch = useCallback(() => setRefetchId((id) => id + 1), []);

  if (!config) {
    return { price: null, formattedTotal: '$0.00', isLoading: false, error: null, refetch };
  }

  // Loading until the shown result belongs to the current inputs. Derived instead of
  // stored, so a stale response can never end the loading state early.
  const isCurrent =
    result !== null &&
    result.refetchId === refetchId &&
    result.inputs.selections === selections &&
    result.inputs.addOns === addOns &&
    result.inputs.quantity === quantity;

  return {
    price: result?.price ?? null,
    formattedTotal: result?.formattedTotal ?? '$0.00',
    isLoading: !isCurrent,
    error: isCurrent ? result.error : null,
    refetch,
  };
}
