import Link from "next/link";
import ProductCard from "../_store/ProductCard";
import StoreShell from "../_store/StoreShell";
import { StoreCategory, formatINR, storeCategories, storeProducts } from "../_store/catalog";

type ShopSearchParams = Promise<{ category?: string; q?: string }>;

export const metadata = {
  title: "Shop",
  description: "Browse hardcoded TotalFire esports products, creator gear, merch, and digital passes.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams;
}) {
  const params = await searchParams;
  const requestedCategory = (params.category ?? "All") as "All" | StoreCategory;
  const query = (params.q ?? "").trim().toLowerCase();

  const visibleProducts = storeProducts.filter((product) => {
    const categoryMatches =
      requestedCategory === "All" ? true : product.category === requestedCategory;
    const queryMatches =
      query.length === 0
        ? true
        : `${product.name} ${product.shortDescription}`.toLowerCase().includes(query);

    return categoryMatches && queryMatches;
  });

  const totalInventoryValue = visibleProducts.reduce((sum, product) => {      
    return sum + product.price * product.stock;
  }, 0);

  return (
    <StoreShell>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-10 text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">All Products</h1>
          <p className="text-lg text-gray-600">
            Hardcoded catalog page with category filters, searchable product descriptions, and direct
            links to product detail and cart flows.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 mb-10 items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <form className="flex w-full xl:w-auto gap-3 items-center" action="/shop" method="GET">    
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search gear, merch, or digital products"
              className="px-4 py-2 w-full sm:w-80 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow"
            />
            {requestedCategory !== "All" && (
              <input type="hidden" name="category" value={requestedCategory} />
            )}
            <button type="submit" className="bg-orange-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-700 shadow-sm transition-colors whitespace-nowrap">        
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-2 justify-center xl:justify-end w-full xl:w-auto">
            {(["All", ...storeCategories] as const).map((category) => {
              const href =
                category === "All"
                  ? "/shop"
                  : `/shop?category=${encodeURIComponent(category)}`;

              const active = requestedCategory === category;
              return (
                <Link
                  key={category}
                  href={href}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${active ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500 mb-8 pb-4 border-b border-gray-100">
          <span>{visibleProducts.length} products visible</span>
          <span className="hidden sm:inline">•</span>
          <span>Inventory value: {formatINR(totalInventoryValue)}</span>      
          <span className="hidden sm:inline">•</span>
          <span>Prices shown in INR</span>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600 mb-6">Try removing filters or search with a broader keyword.</p>     
            <Link href="/shop" className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 shadow-md transition-colors">
              Reset Filters
            </Link>
          </div>
        )}
      </section>
    </StoreShell>
  );
}
