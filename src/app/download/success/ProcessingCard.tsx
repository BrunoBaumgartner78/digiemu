"use client";

export default function ProcessingCard() {
  return (
    <>
      <h1 className="neo-title">🎉 Kauf erfolgreich</h1>
      <p className="neo-text">Zahlung wird noch verarbeitet. Bitte kurz warten.</p>
      <p className="neo-text opacity-70" style={{ marginTop: 8 }}>
        Wir prüfen automatisch, sobald alles bereit ist.
      </p>
    </>
  );
}
