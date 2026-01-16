// src/app/api/vendor/products/low-performance/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🧪 Stub: Noch keine echte Logik – immer eine valide, harmlose Antwort
    return NextResponse.json(
      {
        products: [],
      },
      { status: 200 }
    );
  } catch (_e) {
    console.error("Low-performance API error", e);

    // Selbst im Fehlerfall: niemals 500 an den Client, immer gültiges JSON
    return NextResponse.json(
      {
        products: [],
        error: "internal_error",
      },
      { status: 200 }
    );
  }
}
