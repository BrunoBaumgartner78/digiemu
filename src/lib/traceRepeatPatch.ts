type RepeatFn = (count: number) => string

export function applyTraceRepeatPatch(): void {
  try {
    const proto = String.prototype as unknown as {
      repeat: RepeatFn & { __patched?: boolean }
    }

    const orig = (proto.repeat as unknown) as ((...args: unknown[]) => string)
    if ((orig as unknown as { __patched?: boolean }).__patched) return

    const origFn = orig

    const wrapped: RepeatFn & { __patched?: boolean } = ((count: number) => {
      const coerced = Number(count)

      if (!Number.isFinite(coerced) || coerced < 0) {
        try {
          console.error("String.prototype.repeat called with invalid count (client)")
          console.error("count:", count, "(Number ->", coerced, ")")
          console.error("this preview:", String.prototype.toString().slice(0, 120))
          console.error(new Error("repeat(invalid) trace (client)").stack)
        } catch {
          /* ignore */
        }
      }

      return origFn.call(String.prototype, count)
    }) as RepeatFn & { __patched?: boolean }

    wrapped.__patched = true
    proto.repeat = wrapped

    // best-effort log; harmless if printed
    console.log("trace-repeat patch active")
  } catch (err: unknown) {
    console.warn("trace-repeat patch failed", err)
  }
}

export default applyTraceRepeatPatch
