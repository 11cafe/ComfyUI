export function injectCSS(url: string) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    // link.onload = () => resolve();
    // link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));

    document.head.appendChild(link);
  });
}
