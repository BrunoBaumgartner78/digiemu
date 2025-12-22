import dynamic from "next/dynamic";

// Helper to lazy-load optional modules (no SSR by default)
export function lazyClient<T extends Record<string, any>>(
  loader: () => Promise<T>,
  exportName: keyof T
) {
  return dynamic(async () => {
    const mod = await loader();
    return mod[exportName] as any;
  }, { ssr: false });
}
