import Link from "next/link";
import StoreShell from "../_store/StoreShell";
import { formatINR, getProductBySlug, storeProducts } from "../_store/catalog";

type CartSearchParams = Promise<{ product?: string }>;

export const metadata = {
  title: "Cart",
  description: "Review selected products and order summary before checkout.",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: CartSearchParams;
}) {
  const params = await searchParams;

  const selectedProduct = params.product ? getProductBySlug(params.product) : undefined;

  const items = selectedProduct
    ? [
        { product: selectedProduct, quantity: 1 },
        { product: storeProducts[2], quantity: 1 },
      ]
    : [
        { product: storeProducts[0], quantity: 1 },
        { product: storeProducts[5], quantity: 2 },
      ];

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 3999 ? 0 : 149;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + gst;

  return (
    <StoreShell>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-10 text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-lg text-gray-600">Order summary, taxes, and shipping are visible for transparent checkout review.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            {items.map((item) => (
              <article key={item.product.slug} className="flex flex-col sm:flex-row justify-between p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-500 transition-colors">
                <div className="mb-4 sm:mb-0 space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">{item.product.name}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2 max-w-lg">{item.product.shortDescription}</p>
                  <Link href={`/shop/${item.product.slug}`} className="inline-block text-orange-600 font-semibold hover:underline text-sm mt-2">
                    View details
                  </Link>
                </div>
                <div className="flex flex-row justify-between sm:flex-col sm:items-end sm:justify-center">
                  <span className="text-sm text-gray-500 font-medium mb-1">Qty: {item.quantity}</span>
                  <strong className="text-lg font-black text-gray-900">{formatINR(item.product.price * item.quantity)}</strong>
                </div>
              </article>
            ))}
          </div>

          <aside className="w-full lg:w-96 bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col h-fit">
            <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Order Summary</h2>
            <div className="space-y-4 text-gray-700 font-medium mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatINR(gst)}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-200 pt-6 mb-8">
              <span className="text-lg font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-gray-900">{formatINR(total)}</span>
            </div>

            <Link href="/checkout" className="w-full block text-center bg-green-600 text-white text-lg font-bold py-4 px-6 rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all mb-4">
              Proceed to Checkout
            </Link>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Secure card, UPI, and netbanking flow via Cashfree checkout gateway.
            </p>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
