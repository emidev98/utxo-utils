import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePricing } from "../hooks/usePricing";

interface PricingContextProps {
  latestPrice: number;
}

const PricingContext = createContext<PricingContextProps>({
  latestPrice: 0,
});

export const LatestPriceContext = ({ children }: { children: ReactNode }) => {
  const { getLatestPrice, PRICING_CACHE_EXPIRING_TIME } = usePricing();
  const [latestPrice, setLatestPrice] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const latestPrice = await getLatestPrice();
      setLatestPrice(latestPrice);
    })();

    const intervalRef = setInterval(async () => {
      const latestPrice = await getLatestPrice();
      setLatestPrice(latestPrice);
    }, PRICING_CACHE_EXPIRING_TIME);

    return () => clearInterval(intervalRef);
  }, []);

  return (
    <PricingContext.Provider value={{ latestPrice }}>
      {children}
    </PricingContext.Provider>
  );
};

export const useLatestPricingContext = () => useContext(PricingContext);
