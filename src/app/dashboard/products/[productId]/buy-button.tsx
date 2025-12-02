"use client";

export default function BuyButton({ productId }: { productId: string }) {
  async function handleBuy() {
    const res = await fetch("/api/checkout/create-session", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <button
      onClick={handleBuy}
      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded"
    >
      Jetzt kaufen
    </button>
  );
}
