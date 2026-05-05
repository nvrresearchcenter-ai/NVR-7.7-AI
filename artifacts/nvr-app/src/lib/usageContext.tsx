import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchUsage, type UsageSummary } from "./api";

interface UsageContextType {
  usage: UsageSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType>({
  usage: null, loading: true, refresh: async () => {},
});

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchUsage();
      setUsage(data);
    } catch {
      // silently fail — app still usable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  return (
    <UsageContext.Provider value={{ usage, loading, refresh }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  return useContext(UsageContext);
}

export const PLAN_LABELS: Record<string, string> = {
  free:  "NVR 7.7 Free",
  spark: "Spark Standard",
  pro:   "Pro Standard Plus",
  agent: "NVR 8.8 Agent",
  super: "NVR 9.9 Super Agent",
};

export const PLAN_COLORS: Record<string, string> = {
  free:  "text-gray-400",
  spark: "text-blue-400",
  pro:   "text-cyan-400",
  agent: "text-purple-400",
  super: "text-amber-400",
};
