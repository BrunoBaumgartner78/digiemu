type Args = unknown[];

const enabled =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEBUG === "1";

export const debug = {
  log: (...args: Args) => enabled && console.log(...args),
  info: (...args: Args) => enabled && console.info(...args),
  warn: (...args: Args) => enabled && console.warn(...args),
  error: (...args: Args) => enabled && console.error(...args),
};
