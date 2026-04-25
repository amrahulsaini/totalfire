import Link from "next/link";
import StoreShell from "../_store/StoreShell";
import { formatINR, storeProducts } from "../_store/catalog";
import PlaceOrderButton from "./PlaceOrderButton";

export const metadata = {
  title: "Checkout",
  description:
    "Secure checkout flow with clear tax, shipping, and policy references suitable for payment review.",
};

export default function CheckoutPage() {
  const orderItems = [
    { product: storeProducts[0], qty: 1 },
    { product: storeProducts[6], qty: 1 },
    { product: storeProducts[5], qty: 1 },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + gst;

  return (
    <StoreShell>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-10 text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Secure Checkout</h1>
          <p className="text-lg text-gray-600">
            Secure your order with encrypted transaction processing. Delivery and tracking updates will be provided via email.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-10">
            <article className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Delivery Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Full Name</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="TotalFire Customer" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="+91 90000 00000" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Email Address</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="orders@totalfire.in" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Pincode</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="560001" />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Address Line</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="No. 42, Esports Avenue, Bengaluru" />  
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">City</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="Bengaluru" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">State</span>
                  <input className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900 transition-shadow" defaultValue="Karnataka" />
                </label>
              </div>
            </article>

            <article className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-gray-50 text-gray-900 font-medium">
                  <input type="radio" className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300" defaultChecked /> Cashfree UPI
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-gray-50 text-gray-900 font-medium">
                  <input type="radio" className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300" /> Debit / Credit Card
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-gray-50 text-gray-900 font-medium">
                  <input type="radio" className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300" /> Netbanking
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-gray-50 text-gray-900 font-medium">
                  <input type="radio" className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300" /> Wallet
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Payments are collected through Cashfree checkout with encrypted transaction processing.
              </p>
            </article>

            <article className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Compliance Notes</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All prices shown in INR and inclusive tax notes are provided in invoice.</li>
                <li>Digital products are delivered via registered email immediately after payment.</li>
                <li>Physical products include shipping updates with tracking in dashboard.</li>
              </ul>
            </article>
          </div>

          <aside className="w-full lg:w-96 bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col h-fit">
            <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Order Snapshot</h2>
            <div className="space-y-4 mb-6 text-gray-800">
              {orderItems.map((item) => (
                <div key={item.product.slug} className="flex justify-between items-center text-sm font-medium border-b border-gray-100 pb-2">
                  <span className="max-w-[180px] line-clamp-1">
                    {item.product.name} <span className="text-gray-500 text-xs ml-1">x{item.qty}</span>
                  </span>
                  <span className="font-bold">{formatINR(item.product.price * item.qty)}</span>       
                </div>
              ))}
            </div>
            
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
              <span className="text-lg font-bold text-gray-900">Total Payable</span>
              <span className="text-2xl font-black text-gray-900">{formatINR(total)}</span>
            </div>

            <PlaceOrderButton />
            
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-gray-500">
              <Link href="/policies/terms" className="hover:text-orange-600 transition-colors">Terms</Link>
              <Link href="/policies/refund" className="hover:text-orange-600 transition-colors">Refund</Link>
              <Link href="/policies/shipping" className="hover:text-orange-600 transition-colors">Shipping</Link>
              <Link href="/policies/privacy" className="hover:text-orange-600 transition-colors">Privacy</Link>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
