"use client";
import { useEffect } from "react";

export default function TraceRepeatClient() {
  useEffect(() => {
    try {
      const orig = String.prototype.repeat as any;
      if (orig && orig.__patched) return;

      const origFn = orig;
      function wrapped(this: any, count: any) {
        const coerced = Number(count);
        if (coerced < 0) {
          try {
            // eslint-disable-next-line no-console
            console.error(" String.prototype.repeat called with NEGATIVE count (client)");
            // eslint-disable-next-line no-console
            console.error('count:', count, '(Number ->', coerced, ')');
            // eslint-disable-next-line no-console
            console.error('this preview:', String(this).slice(0, 120));
            // eslint-disable-next-line no-console
            console.error(new Error('repeat(-) trace (client)').stack);
          } catch (e) {}
        }

        return origFn.call(this, count);
      }

      (wrapped as any).__patched = true;
      // @ts-ignore
      String.prototype.repeat = wrapped;
      // eslint-disable-next-line no-console
      console.log(' trace-repeat client active');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('trace-repeat client failed', err);
    }
  }, []);

  return null;
}
