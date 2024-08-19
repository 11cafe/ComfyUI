export const swrFetcher = (url: string) => fetch(url).then((res) => res.json());

const apiKeysToCache = ["/api/machine/listMachineModels?machineID=*"];

// Function to check if a URL matches any of the patterns in apiKeysToCache
function matchesAnyPattern(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(url);
    }
    return url === pattern;
  });
}

export function swrLocalStorageProvider() {
  if (typeof window === "undefined") {
    // Return a dummy storage for server-side rendering
    return new Map();
  }

  // When initializing, we restore the data from localStorage into a map.
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem("app-cache") || "[]"),
  );

  // Before unloading the app, we write back all the data into localStorage.
  window.addEventListener("beforeunload", () => {
    const cacheMap = new Map<string, any>();
    for (const [key, value] of map.entries()) {
      console.log("key", key);
      if (matchesAnyPattern(key, apiKeysToCache)) {
        cacheMap.set(key, value);
      }
    }
    const appCache = JSON.stringify(Array.from(cacheMap.entries()));
    localStorage.setItem("app-cache", appCache);
  });

  // We still use the map for write & read for performance.
  return map;
}
