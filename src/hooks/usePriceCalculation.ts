// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useEffectEvent, useMemo } from 'react';
import type {
  Configuration,
  Product,
  PriceBreakdown,
} from '../components/ProductConfigurator/types';
import { calculatePrice } from '../services/api';
import { formatPrice } from '../utils/pricing';

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
}

// The parts of a configuration that affect the price.
type PricingInputs = Partial<Pick<Configuration, 'selections' | 'addOns' | 'quantity'>>;

interface PriceResult {
  // What this result was calculated for, so we can tell whether it is still current.
  inputs: PricingInputs;
  price: PriceBreakdown | null;
  formattedTotal: string | null;
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

  const selections = config?.selections;
  const addOns = config?.addOns;
  const quantity = config?.quantity;

  // A new reference only when one of the pricing inputs changes. It triggers the request
  // and identifies the result. If React ever drops this memo, we only refetch once more.
  const inputs = useMemo<PricingInputs>(
    () => ({ selections, addOns, quantity }),
    [selections, addOns, quantity],
  );

  // Reads the latest config inside the effect without making fields that don't affect
  // the price (e.g. the draft name) a dependency, so typing a name doesn't refetch.
  const getConfig = useEffectEvent(() => config);

  useEffect(() => {
    const requestConfig = getConfig();
    if (!requestConfig) return;

    // Responses can arrive out of order. Cleanup marks this request as stale as soon as
    // the inputs change (or the component unmounts), so only the latest response is applied.
    let isStale = false;

    calculatePrice(requestConfig, product).then(
      (response) => {
        if (isStale) return;
        setResult({
          inputs,
          price: response.breakdown,
          formattedTotal: response.formattedTotal,
          error: null,
        });
      },
      () => {
        if (isStale) return;
        setResult((previous) => ({
          inputs,
          price: null,
          formattedTotal: previous?.formattedTotal ?? null,
          error: 'ERR_PRICE_CALC_FAILED',
        }));
      },
    );

    return () => {
      isStale = true;
    };
  }, [inputs, product]);

  const placeholderTotal = formatPrice(0, product.currency);

  if (!config) {
    return { price: null, formattedTotal: placeholderTotal, isLoading: false, error: null };
  }

  // Loading until the shown result belongs to the current inputs. Derived instead of
  // stored, so a stale response can never end the loading state early.
  const isCurrent = result?.inputs === inputs;

  return {
    price: result?.price ?? null,
    formattedTotal: result?.formattedTotal ?? placeholderTotal,
    isLoading: !isCurrent,
    error: isCurrent ? (result?.error ?? null) : null,
  };
}
