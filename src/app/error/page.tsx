// src/app/error/page.tsx

import Link from "next/link";

type SearchParams = {
  canceled?: string | string[];
  productId?: string | string[];
  [key: string]: string | string[] | undefined;
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;

  const canceled =
    typeof resolved.canceled === "string"
      ? resolved.canceled
      : Array.isArray(resolved.canceled)
      ? resolved.canceled[0]
      : undefined;

  return (
    <main className="page-shell">
      <section className="neumorph-card max-w-xl mx-auto p-8 md:p-10 rounded-3xl text-center space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Zahlung abgebrochen
        </h1>

        <p className="text-sm text-muted">
          {canceled === "1"
            ? "Du hast den Bezahlvorgang abgebrochen. Es wurde keine Zahlung belastet."
            : "Es ist ein Fehler beim Bezahlvorgang aufgetreten."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Link href="/shop" className="neobtn">
            Zurück zum Shop
          </Link>
          <Link href="/" className="neobtn primary">
            Zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
