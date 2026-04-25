import Link from "next/link";
import StoreShell from "../_store/StoreShell";

export const metadata = {
  title: "Support",
  description: "Customer support, help channels, and policy quick links for TotalFire commerce.",
};

const faq = [
  {
    q: "How quickly are digital products delivered?",
    a: "Digital items like Tournament Pass and Gift Cards are delivered to your registered email within 2 minutes after payment success.",
  },
  {
    q: "Can I cancel a physical order before dispatch?",
    a: "Yes, cancellation is possible before packing begins. Once shipped, standard return and refund terms apply.",
  },
  {
    q: "Do you provide GST invoices?",
    a: "Yes, every successful order includes an itemized invoice with GST details in your order dashboard and email receipt.",
  },
  {
    q: "How do payment failures get handled?",
    a: "Failed transactions are automatically reversed by the bank or payment network based on settlement rules.",
  },
];

export default function SupportPage() {
  return (
    <StoreShell>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-12 text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Customer Support</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Dedicated support center for order issues, payment clarification, and delivery assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 mt-8 lg:grid-cols-3 gap-8 mb-16">
          <article className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Primary Contact</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong className="text-gray-900">Email:</strong> <a href="mailto:team@totalfire.in" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">team@totalfire.in</a></p>
              <p><strong className="text-gray-900">Response SLA:</strong> within 24 hours</p>
              <p><strong className="text-gray-900">Hours:</strong> 24x7 email support</p>
              <p className="text-sm mt-4 pt-4 border-t border-gray-100 text-gray-500">
                <strong className="text-gray-700 block mb-1">Escalation:</strong>
                Include order ID in subject for faster routing.
              </p>
            </div>
          </article>

          <article className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Order Assistance</h2>
            <p className="text-gray-700 mb-8 leading-relaxed">
              Track latest order status from your dashboard after checkout confirmation.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/dashboard" className="w-full text-center bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors shadow-sm hover:shadow">    
                Open Dashboard
              </Link>
              <Link href="/checkout" className="w-full text-center bg-white border border-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all">     
                Revisit Checkout
              </Link>
            </div>
          </article>

          <article className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Policy Quick Links</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/policies/privacy" className="flex items-center gap-3 text-gray-700 hover:text-orange-600 font-semibold p-3 -mx-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <span className="text-orange-500">?</span> Privacy Policy
                </Link>
              </li>   
              <li>
                <Link href="/policies/terms" className="flex items-center gap-3 text-gray-700 hover:text-orange-600 font-semibold p-3 -mx-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <span className="text-orange-500">?</span> Terms of Use
                </Link>
              </li>       
              <li>
                <Link href="/policies/shipping" className="flex items-center gap-3 text-gray-700 hover:text-orange-600 font-semibold p-3 -mx-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <span className="text-orange-500">?</span> Shipping Policy
                </Link>
              </li> 
              <li>
                <Link href="/policies/refund" className="flex items-center gap-3 text-gray-700 hover:text-orange-600 font-semibold p-3 -mx-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <span className="text-orange-500">?</span> Refund Policy
                </Link>
              </li>     
            </ul>
          </article>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {faq.map((item) => (
              <article key={item.q} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
