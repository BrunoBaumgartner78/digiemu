/* eslint-disable react/no-unescaped-entities */
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h1>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          An unexpected error occurred. You can try again.
        </p>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 16, opacity: 0.75 }}>
          {error?.message}
          {error?.digest ? `\nDigest: ${error.digest}` : ""}
        </pre>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "white",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
