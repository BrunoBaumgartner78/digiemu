export type PurchaseTemplateData = {
  product_name: string;
  purchase_date: string;
  order_id: string;
  download_link: string;
  download_link_expiry: string;
  amount: string;
};

export function buildPurchaseConfirmationText(d: PurchaseTemplateData) {
  return `Vielen Dank für deinen Kauf: ${d.product_name}\n\nBestellnummer: ${d.order_id}\nDatum: ${d.purchase_date}\nBetrag: ${d.amount}\n\nDein Download-Link: ${d.download_link}\nGültig bis: ${d.download_link_expiry}\n\nHinweis: Bei digitalen Inhalten erlischt das Widerrufsrecht mit Beginn des Downloads gemäß Art. 16 lit. m der EU-Richtlinie 2011/83/EU.`;
}

export function buildPurchaseConfirmationHtml(d: PurchaseTemplateData) {
  return `
  <html>
  <body>
    <p>Vielen Dank für deinen Kauf: <strong>${d.product_name}</strong></p>
    <p>
      <strong>Bestellnummer:</strong> ${d.order_id}<br/>
      <strong>Datum:</strong> ${d.purchase_date}<br/>
      <strong>Betrag:</strong> ${d.amount}
    </p>
    <p>Dein Download-Link: <a href="${d.download_link}">Hier herunterladen</a></p>
    <p>Gültig bis: ${d.download_link_expiry}</p>
    <hr/>
    <p style="font-size:12px;opacity:0.85">Hinweis: Bei digitalen Inhalten erlischt das Widerrufsrecht mit Beginn des Downloads gemäß Art. 16 lit. m der EU-Richtlinie 2011/83/EU.</p>
  </body>
  </html>
  `;
}

export default { buildPurchaseConfirmationText, buildPurchaseConfirmationHtml };
