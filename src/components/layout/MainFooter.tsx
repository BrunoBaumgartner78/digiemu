// src/components/layout/MainFooter.tsx
import Link from "next/link";

const footerMainLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/prices", label: "Preise" },
  { href: "/help", label: "Hilfe" },
];

const footerLegalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
];

export function MainFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-slate-50/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            DigiEmu – Digital Marketplace for Creators
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kuratierter Multivendor-Marktplatz für digitale Produkte mit
            transparenter 80/20-Aufteilung.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <nav className="flex flex-col gap-1 text-xs sm:text-sm">
            {footerMainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-1 text-xs sm:text-sm">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-4 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} DigiEmu – Digital Marketplace for Creators
      </div>
    </footer>
  );
}
