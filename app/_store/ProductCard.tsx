import Link from "next/link";
import Image from "next/image";
import { StoreProduct, formatINR } from "./catalog";

export default function ProductCard({ product }: { product: StoreProduct }) {
  const discount = Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100));

  return (
    <article className="bg-white border text-gray-900 border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group h-full hover:border-orange-500">
      <div className="h-48 sm:h-56 relative flex items-center justify-center p-6 text-center select-none border-b border-gray-200 overflow-hidden bg-gray-50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
          {product.heroLabel}
        </span>
        {product.badge && (
          <span className="absolute top-4 right-4 bg-white/90 text-orange-600 border border-orange-500 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-200">
            ★ {product.rating.toFixed(1)}
          </span>
          <span>{product.reviews.toLocaleString("en-IN")} reviews</span>
        </div>

        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3 flex-1 min-h-[4.5rem]">
          {product.shortDescription}
        </p>

        <div className="flex items-baseline flex-wrap gap-2 mb-6">
          <div className="text-2xl font-black text-gray-900">{formatINR(product.price)}</div>
          <div className="text-sm font-medium text-gray-400 line-through">{formatINR(product.mrp)}</div>
          {discount > 0 && (
            <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md ml-auto border border-orange-200">
              -{discount}%
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-auto">
          <Link
            href={`/shop/${product.slug}`}
            className="flex-1 bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 sm:py-2.5 px-4 rounded-lg hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all text-center shadow-sm text-sm"
          >
            View Details
          </Link>
          <Link
            href={`/cart?product=${product.slug}`}
            className="flex-1 bg-green-600 text-white font-bold py-3 sm:py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors text-center text-sm"
          >
            Add to Cart
          </Link>
        </div>
      </div>
    </article>
  );
}
