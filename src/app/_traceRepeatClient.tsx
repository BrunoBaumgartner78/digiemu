"use client";

import { useEffect } from "react";

declare global {
  interface String {
    // keep TS happy when we patch
    repeat(count: number): string;
  }
}

type RepeatFn = (this: any, count: number) => string;

export default function TraceRepeatClient() {
  useEffect(() => {
    try {
      const proto = String.prototype as unknown as {
        repeat: RepeatFn & { __patched?: boolean };
      };

      const orig = proto.repeat;
      if (orig && orig.__patched) return;

      const origFn = orig;

      const wrapped: RepeatFn & { __patched?: boolean } = function wrapped(
        this: any,
        count: number
      ) {
        const coerced = Number(count);

        if (!Number.isFinite(coerced) || coerced < 0) {
          try {
            // eslint-disable-next-line no-console
            console.error("String.prototype.repeat called with invalid count (client)");
            // eslint-disable-next-line no-console
            console.error("count:", count, "(Number ->", coerced, ")");
            // eslint-disable-next-line no-console
            console.error("this preview:", String(this).slice(0, 120));
            // eslint-disable-next-line no-console
            console.error(new Error("repeat(invalid) trace (client)").stack);
          } catch {
            /* ignore */
          }
        }

        return origFn.call(this, count);
      };

      wrapped.__patched = true;
      proto.repeat = wrapped;

      // eslint-disable-next-line no-console
      console.log("trace-repeat client active");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("trace-repeat client failed", err);
    }
  }, []);

  return null;
}
