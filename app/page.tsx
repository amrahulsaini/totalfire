import Link from "next/link";
import { BadgeCheck, Flame, ShieldCheck, Truck, WalletCards } from "lucide-react";
import ProductCard from "./_store/ProductCard";
import StoreShell from "./_store/StoreShell";
import {
  complianceHighlights,
  formatINR,
  storeProducts,
  storefrontStats,
} from "./_store/catalog";

export default function Home() {
  const featuredProducts = storeProducts.slice(0, 4);
  const spotlightProducts = storeProducts.slice(4, 8);
  const budgetAccessories = storeProducts.filter((product) => product.price <= 75).slice(0, 3);

  return (
    <StoreShell>
      <section className="bg-white border-b border-gray-200 text-gray-900 py-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-sm font-bold tracking-wider uppercase text-gray-500">TotalFire.in Official Commerce</span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-gray-900">
              Gear Up Like a
              <span className="text-orange-600"> Championship Roster</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Level up your gaming setup with premium peripherals, exclusive merchandise, and high-performance gear designed for elite players.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/shop" className="bg-gray-900 text-white font-bold py-3 px-8 rounded-lg shadow-sm hover:bg-black transition-colors">
                Explore Products
              </Link>
              <Link href="/checkout" className="bg-transparent border border-gray-300 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors">
                View Checkout Flow
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
              {storefrontStats.map((item) => (
                <article key={item.label} className="flex flex-col">
                  <strong className="text-3xl font-black">{item.value}</strong>
                  <span className="text-sm text-gray-500">{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border-gray-200 rounded-2xl p-8 border shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Launch Highlights</h2>
            <ul className="space-y-4 mb-8 text-gray-700">
              <li className="flex items-center gap-3"><Flame size={20} className="text-orange-500" /> Fire-themed peripherals curated for esports setups</li>
              <li className="flex items-center gap-3"><WalletCards size={20} className="text-gray-500" /> Transparent pricing, taxes, and order summaries</li>
              <li className="flex items-center gap-3"><ShieldCheck size={20} className="text-green-600" /> Cashfree-backed secure payment journey</li>
              <li className="flex items-center gap-3"><Truck size={20} className="text-gray-500" /> Clear shipping and fulfillment disclosure pages</li>
            </ul>
            <div className="bg-white rounded-lg p-4 text-center text-gray-900 border border-gray-200 font-medium shadow-sm">
              Starting from <strong className="text-xl text-green-600 font-bold">{formatINR(Math.min(...storeProducts.map((product) => product.price)))}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">Featured Firepower</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Best-converting items selected for home-page merchandising and checkout confidence.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6 sm:px-12 lg:px-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">Budget Add-Ons</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quick low-cost accessories for users who want simple earphones and phone cooling gear from ₹25 to ₹75.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {budgetAccessories.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6 sm:px-12 lg:px-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Compliance Signals for Payment Review</h2>
              <p className="text-gray-600">
                The storefront intentionally exposes customer care, legal policy pages, and secure checkout
                labels so merchant review teams can verify trust and user clarity quickly.
              </p>
            </div>

            <div className="space-y-4">
              {complianceHighlights.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-gray-800 font-medium bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <BadgeCheck size={24} className="text-green-600" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Creator and Setup Essentials</h2>
              <p className="text-gray-600">Supplemental products positioned for upsell from PDP and checkout bundles.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spotlightProducts.map((product) => (
                <Link key={product.slug} href={`/shop/${product.slug}`} className="block bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group">
                  <strong className="block text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{product.name}</strong>
                  <span className="block text-sm text-gray-500 mb-3">{product.heroLabel}</span>
                  <em className="block text-lg font-semibold text-green-600 not-italic">{formatINR(product.price)}</em>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 text-white py-16 px-6 sm:px-12 text-center border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Need Help with Verification?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Navigate through complete sample flows for product browsing, cart, checkout, policy access,
            and post-order dashboard visibility.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors">
              Open Ecommerce Dashboard
            </Link>
            <Link href="/support" className="bg-transparent border border-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-800 transition-colors">
              Contact Support Page
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
