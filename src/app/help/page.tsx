export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#111] text-white px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Hilfe & FAQ</h1>
        <p className="mb-4 text-gray-300">
          Hier entsteht die Hilfe-Seite für DigiEmu. 
          Du kannst hier später Anleitungen für Verkäufer und Käufer einbauen:
        </p>

        <ul className="space-y-3 text-gray-300">
          <li>• Wie registriere ich mich?</li>
          <li>• Wie lade ich ein Produkt hoch?</li>
          <li>• Wie funktioniert die Auszahlung?</li>
          <li>• Wie kontaktiere ich den Support?</li>
        </ul>

        <p className="mt-8 text-sm text-gray-500">
          (Im Moment ist das nur eine Platzhalter-Seite für das lokale Testing.)
        </p>
      </div>
    </div>
  );
}
