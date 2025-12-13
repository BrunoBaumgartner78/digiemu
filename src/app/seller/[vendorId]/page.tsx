import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
// import styles from "./SellerProfile.module.css";

export default async function SellerProfilePage({ params }: { params: { vendorId: string } }) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: params.vendorId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  return (
    <main className="seller-public-page">
      {/* Banner */}
      {vendor.bannerUrl && (
        <div className="seller-banner">
          <img
            src={vendor.bannerUrl}
            alt={vendor.displayName ?? "Seller banner"}
          />
        </div>
      )}

      {/* Header mit Avatar & Bio */}
      <section className="seller-header">
        {vendor.avatarUrl && (
          <img
            className="seller-avatar"
            src={vendor.avatarUrl}
            alt={vendor.displayName ?? vendor.user?.name ?? "Seller"}
          />
        )}
        <div className="seller-header-text">
          <h1>{vendor.displayName ?? vendor.user?.name ?? "Verkäufer"}</h1>
          {vendor.bio && <p className="seller-bio">{vendor.bio}</p>}
        </div>
      </section>

      {/* Social Links */}
      <section className="seller-links">
        {vendor.websiteUrl && (
          <a href={vendor.websiteUrl} target="_blank" rel="noreferrer">
            Website
          </a>
        )}
        {vendor.instagramUrl && (
          <a href={vendor.instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
        )}
        {vendor.twitterUrl && (
          <a href={vendor.twitterUrl} target="_blank" rel="noreferrer">
            Twitter/X
          </a>
        )}
        {vendor.tiktokUrl && (
          <a href={vendor.tiktokUrl} target="_blank" rel="noreferrer">
            TikTok
          </a>
        )}
        {vendor.facebookUrl && (
          <a href={vendor.facebookUrl} target="_blank" rel="noreferrer">
            Facebook
          </a>
        )}
      </section>

      {/* Produkt-Grid */}
      <section className="seller-products-section">
        <div className="seller-products-header">
          <h2>Produkte von {vendor.displayName ?? vendor.user?.name ?? "diesem Verkäufer"}</h2>
          <p>
            {vendor.products.length === 0
              ? "Dieser Verkäufer hat noch keine Produkte veröffentlicht."
              : `${vendor.products.length} Produkt${
                  vendor.products.length === 1 ? "" : "e"
                } im Shop`}
          </p>
        </div>

        {vendor.products.length > 0 && (
          <div className="seller-products-grid">
            {vendor.products.map((product) => (
              <article
                key={product.id}
                className="seller-product-card"
              >
                <div className="seller-product-thumbnail-wrapper">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="seller-product-thumbnail"
                    />
                  ) : (
                    <div className="seller-product-thumbnail placeholder">
                      <span>{product.title.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className="seller-product-info">
                  <h3 className="seller-product-title">{product.title}</h3>
                  {product.description && (
                    <p className="seller-product-description">
                      {product.description.length > 120
                        ? product.description.slice(0, 117) + "..."
                        : product.description}
                    </p>
                  )}
                  <div className="seller-product-meta">
                    <span className="seller-product-price">
                      {(product.priceCents / 100).toFixed(2)} CHF
                    </span>
                    {/* Optional: Link zur Produkt-Detailseite, falls vorhanden */}
                    {/* <Link href={`/product/${product.id}`} className="seller-product-link">
                      Zum Produkt
                    </Link> */}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
