"use client";
import { useState } from "react";
import styles from "./NewProductForm.module.css";
import { UploadCard } from "../../../../components/dashboard/UploadCard";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "",
    priceCents: "",
    thumbnail: "",
    fileUrl: "",
  });

  async function handleSubmit() {
    setError("");
    setLoading(true);

    // Validation
    if (!data.title || data.title.length < 3) {
      setError("Titel muss mindestens 3 Zeichen haben.");
      toast({ title: "Titel muss mindestens 3 Zeichen haben.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!data.description || data.description.length < 10 || data.description.length > 300) {
      setError("Beschreibung muss zwischen 10 und 300 Zeichen sein.");
      toast({ title: "Beschreibung muss zwischen 10 und 300 Zeichen sein.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!data.category) {
      setError("Bitte eine Kategorie wählen.");
      toast({ title: "Bitte eine Kategorie wählen.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!data.priceCents || Number(data.priceCents) <= 0) {
      setError("Bitte einen gültigen Preis in CHF angeben.");
      toast({ title: "Bitte einen gültigen Preis in CHF angeben.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!data.fileUrl) {
      setError("Datei-URL ist erforderlich.");
      toast({ title: "Datei-URL ist erforderlich.", variant: "destructive" });
      setLoading(false);
      return;
    }
    // thumbnail is optional

    try {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.ok) {
        setError(result.error || "Fehler beim Anlegen.");
        toast({ title: result.error || "Fehler beim Anlegen.", variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Produkt erfolgreich angelegt!", variant: "success" });
      setTimeout(() => router.push("/dashboard/products"), 1200);
    } catch (_err) {
      setError("Serverfehler. Bitte versuche es erneut.");
      toast({ title: "Serverfehler. Bitte versuche es erneut.", variant: "destructive" });
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className={styles.card}>
        <h2 className="text-2xl font-bold mb-4">Neues Produkt</h2>

        <input
          type="text"
          placeholder="Titel"
          className={styles.input}
          onChange={(e) => setData({ ...data, title: e.target.value })}
        />

        <textarea
          placeholder="Beschreibung"
          className={styles.input}
          rows={4}
          onChange={(e) =>
            setData({ ...data, description: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Kategorie"
          className={styles.input}
          onChange={(e) =>
            setData({ ...data, category: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Preis in CHF"
          className={styles.input}
          onChange={(e) =>
            setData({
              ...data,
              priceCents: String(Number(e.target.value) * 100),
            })
          }
        />

        <UploadCard
          onUploaded={(upload: Partial<typeof data>) =>
            setData({ ...data, ...upload })
          }
        />

        {error && <div className="text-red-500 font-bold">{error}</div>}
        <LoadingButton
          loading={loading}
          onClick={handleSubmit}
          className={styles.button}
        >
          Produkt erstellen
        </LoadingButton>
      </div>
    </div>
  );
}
