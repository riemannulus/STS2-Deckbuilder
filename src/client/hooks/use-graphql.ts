import { useState, useEffect, useCallback } from "react";

interface UseGraphQLResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGraphQL = <T>(
  query: string,
  variables?: Record<string, unknown>,
  skip?: boolean
): UseGraphQLResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const variablesKey = JSON.stringify(variables);

  const fetchData = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      if (json.errors) {
        setError(json.errors[0]?.message ?? "GraphQL error");
      } else {
        setData(json.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, variablesKey, skip]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
