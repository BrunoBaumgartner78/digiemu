import { useState, FormEvent, ChangeEvent } from "react";
import { z } from "zod";

export type ProductFormValues = {
  title: string;
  description: string;
  priceChf: string;
  category: string;
  file: File | null;
  thumbnail: File | null;
};

const schema = z.object({
  title: z.string().min(2, "Titel ist erforderlich."),
  description: z.string().min(5, "Beschreibung ist erforderlich."),
  priceChf: z.string().refine((val) => Number(val.replace(",", ".")) > 0, {
    message: "Gültiger Preis in CHF erforderlich.",
  }),
  category: z.string().min(1, "Kategorie wählen."),
  file: z.instanceof(File, { message: "Datei auswählen." }),
  thumbnail: z.any().optional(),
});

export function ProductForm({
  initialValues,
  categories,
  onSubmit,
  submitLabel = "Speichern",
  loading = false,
}: {
  initialValues?: Partial<ProductFormValues>;
  categories: string[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    priceChf: initialValues?.priceChf || "",
    category: initialValues?.category || "",
    file: initialValues?.file || null,
    thumbnail: initialValues?.thumbnail || null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setValues((v) => ({ ...v, file: e.target.files?.[0] || null }));
  }

  function handleThumbChange(e: ChangeEvent<HTMLInputElement>) {
    setValues((v) => ({ ...v, thumbnail: e.target.files?.[0] || null }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    try {
      await onSubmit(values);
    } catch (err: any) {
      setFormError(err?.message || "Fehler beim Speichern.");
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium mb-1">Produktname *</label>
        <input
          name="title"
          type="text"
          className="neo-input w-full"
          value={values.title}
          onChange={handleChange}
          required
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>
      <div>
        <label className="block font-medium mb-1">Beschreibung *</label>
        <textarea
          name="description"
          className="neo-input w-full"
          value={values.description}
          onChange={handleChange}
          required
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>
      <div>
        <label className="block font-medium mb-1">Preis (CHF) *</label>
        <input
          name="priceChf"
          type="number"
          step="0.1"
          min="0"
          className="neo-input w-full"
          value={values.priceChf}
          onChange={handleChange}
          required
        />
        {errors.priceChf && <p className="text-red-500 text-xs mt-1">{errors.priceChf}</p>}
      </div>
      <div>
        <label className="block font-medium mb-1">Kategorie *</label>
        <select
          name="category"
          className="neo-input w-full"
          value={values.category}
          onChange={handleChange}
          required
        >
          <option value="">Kategorie wählen …</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
      </div>
      <div>
        <label className="block font-medium mb-1">Datei-Upload *</label>
        <input
          name="file"
          type="file"
          accept=".pdf,.zip,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          required
        />
        {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
      </div>
      <div>
        <label className="block font-medium mb-1">Thumbnail (optional)</label>
        <input
          name="thumbnail"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleThumbChange}
        />
      </div>
      {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
      <button
        type="submit"
        className="neobtn primary w-full mt-2"
        disabled={loading}
      >
        {loading ? "Speichern …" : submitLabel}
      </button>
    </form>
  );
}
