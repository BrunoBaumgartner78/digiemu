(() => {
  const orig = String.prototype.repeat;

  function safePreview(str, n = 120) {
    try {
      const s = String(str);
      return s.length > n ? s.slice(0, n) + "…" : s;
    } catch {
      return "<unprintable>";
    }
  }

  // Avoid double patching
  if ((orig).__patched) {
    console.log("ℹ️ trace-repeat preload already active");
    return;
  }

  Object.defineProperty(String.prototype, "repeat", {
    configurable: true,
    writable: true,
    value: function repeatWrapped(count) {
      const coerced = Number(count);

      if (coerced < 0) {
        const s = String(this);
        console.error("\n🚨 String.prototype.repeat called with NEGATIVE count (server)");
        console.error("count:", count, "(Number ->", coerced, ")");
        console.error("this.length:", s.length);
        console.error("this preview:", JSON.stringify(safePreview(s)));
        console.error("stack:\n", new Error("repeat(-) trace (server)").stack);
        throw new RangeError(`Invalid count value: ${count}`);
      }

      return orig.call(this, count);
    },
  });

  (String.prototype.repeat).__patched = true;
  console.log("✅ trace-repeat preload active: String.prototype.repeat wrapped (server)");
})();
(() => {
  const orig = String.prototype.repeat;

  function safePreview(str, n = 120) {
    try {
      const s = String(str);
      return s.length > n ? s.slice(0, n) + "…" : s;
    } catch {
      return "<unprintable>";
    }
  }

  Object.defineProperty(String.prototype, "repeat", {
    configurable: true,
    writable: true,
    value: function repeatWrapped(count) {
      const coerced = Number(count);

      if (coerced < 0) {
        const s = String(this);
        console.error("\n🚨 String.prototype.repeat called with NEGATIVE count");
        console.error("count:", count, "(Number ->", coerced, ")");
        console.error("this.length:", s.length);
        console.error("this preview:", JSON.stringify(safePreview(s)));
        console.error("stack:\n", new Error("repeat(-) trace").stack);
        throw new RangeError(`Invalid count value: ${count}`);
      }

      return orig.call(this, count);
    },
  });

  console.log("✅ trace-repeat preload active: String.prototype.repeat wrapped");
})();
