import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../_store/ProductCard";
import StoreShell from "../../_store/StoreShell";
import {
  formatINR,
  getProductBySlug,
  getRelatedProducts,
  storeProducts,
} from "../../_store/catalog";

export function generateStaticParams() {
  return storeProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.slug, 3);
  const savings = product.mrp - product.price;

  return (
    <StoreShell>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <Link href="/shop" className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700 transition-colors mb-8">
          &larr; Back to shop
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div
            className="flex-1 flex flex-col justify-center items-center text-center p-12 lg:p-20 rounded-3xl text-white shadow-lg min-h-[400px] lg:min-h-[600px] relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${product.accentFrom} 0%, ${product.accentTo} 100%)`,
            }}
          >
            {product.badge && <span className="absolute top-6 right-6 bg-white text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">{product.badge}</span>}
            <strong className="text-white/80 font-bold tracking-widest uppercase mb-4 block">{product.heroLabel}</strong>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 leading-tight drop-shadow-xl">{product.name}</h1>
            <p className="text-lg md:text-xl font-medium text-white/90 max-w-xl mx-auto leading-relaxed">{product.shortDescription}</p>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-black text-gray-900">{formatINR(product.price)}</span>
              <em className="text-xl text-gray-400 line-through not-italic font-semibold">{formatINR(product.mrp)}</em>
              {savings > 0 && <b className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">Save {formatINR(savings)}</b>}
            </div>

            <p className="text-lg text-gray-600 mb-10 leading-relaxed">{product.description}</p>    

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-100">
              <article>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
                <span className="text-sm font-semibold text-gray-900">{product.category}</span>
              </article>
              <article>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Ratings</label>
                <span className="text-sm font-semibold text-gray-900">
                  <span className="text-green-600 mr-1">★</span>
                  {product.rating.toFixed(1)} ({product.reviews.toLocaleString("en-IN")})
                </span>
              </article>
              <article>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Stock</label>
                <span className="text-sm font-semibold text-gray-900">{product.stock} units</span>
              </article>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href={`/cart?product=${product.slug}`} className="flex-1 text-center bg-orange-600 text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-orange-700 shadow-md hover:shadow-lg transition-all">
                Add to Cart
              </Link>
              <Link href="/checkout" className="flex-1 text-center bg-white border-2 border-gray-200 text-gray-900 text-lg font-bold py-4 px-8 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
                Buy Now
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <article>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Key Features</h2>
                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex gap-2 items-start">
                      <span className="text-orange-500 font-bold mt-0.5">•</span>
                      <span className="text-gray-700 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Technical Specs</h2>
                <ul className="space-y-2">
                  {product.specs.map((spec) => (
                    <li key={spec} className="flex gap-2 items-start">
                      <span className="text-gray-300 font-bold mt-0.5">•</span>
                      <span className="text-gray-700 leading-tight">{spec}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 border-t border-gray-100 bg-white">
        <div className="mb-10 text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Frequently Bought Together</h2>
          <p className="text-gray-600">Cross-sell block with hardcoded recommendations.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedProducts.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
