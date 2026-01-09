export const LEGAL = {
  digitalGoodsNoticeShort: "Digitales Produkt – nach Kauf sofort verfügbar.",
  digitalGoodsWithdrawalEU:
    "Hinweis (EU): Bei digitalen Inhalten erlischt das Widerrufsrecht, sobald du dem sofortigen Beginn der Ausführung zustimmst und bestätigst, dass du dadurch dein Widerrufsrecht verlierst.",
  digitalGoodsNoRefundPolicy:
    "Da es sich um digitale Inhalte handelt, sind Rückgaben nach Download in der Regel ausgeschlossen. Bei technischen Problemen helfen wir sofort.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@bellu.ch",
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "DigiEmu",
  website: process.env.NEXT_PUBLIC_SITE_URL || "https://bellu.ch",
} as const;
