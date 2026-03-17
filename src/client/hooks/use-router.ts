import { useState, useEffect, useCallback } from "react";

interface Route {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

const parseLocation = (): Route => {
  const { pathname, search } = window.location;
  return {
    path: pathname,
    params: {},
    searchParams: new URLSearchParams(search),
  };
};

export const useRouter = () => {
  const [route, setRoute] = useState<Route>(parseLocation);

  useEffect(() => {
    const handlePopState = () => setRoute(parseLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, "", path);
    setRoute(parseLocation());
  }, []);

  return { route, navigate } as const;
};
