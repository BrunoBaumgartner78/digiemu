import { requireNotBlocked } from "@/lib/blockedGuard";

// ...existing imports

export async function POST(req: Request) {
  // ...existing code

  const guard = await requireNotBlocked();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.message },
      { status: guard.status }
    );
  }

  // ...existing code
}

// ...existing code