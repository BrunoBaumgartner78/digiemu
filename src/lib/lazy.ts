import dynamic from "next/dynamic";

// Helper to lazy-load optional modules (no SSR by default)
export function lazyClient<TModule extends Record<string, unknown>, K extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: K
) {
  return dynamic(async () => {
    const mod = await loader();
    // Return the requested export as a component. Keep the runtime cast
    // but avoid `any` in typings by using `unknown` -> `ComponentType<unknown>`.
    return (mod[exportName] as unknown) as React.ComponentType<unknown>;
  }, { ssr: false });
}
