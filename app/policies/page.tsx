import Link from "next/link";
import StoreShell from "../_store/StoreShell";

export const metadata = {
  title: "Policies",
  description: "Central policy index for privacy, terms, shipping, and refunds.",
};

const policyCards = [
  {
    title: "Privacy Policy",
    href: "/policies/privacy",
    summary: "How customer data is collected, secured, and used for order processing.",
  },
  {
    title: "Terms of Use",
    href: "/policies/terms",
    summary: "Platform use conditions, purchase rights, and responsibilities.",
  },
  {
    title: "Shipping Policy",
    href: "/policies/shipping",
    summary: "Dispatch windows, delivery estimates, and shipping fee rules.",
  },
  {
    title: "Refund Policy",
    href: "/policies/refund",
    summary: "Return, replacement, and refund eligibility across product types.",
  },
];

export default function PolicyIndexPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <div className="store-section-head left">
          <h1>Store Policies</h1>
          <p>
            Policy pages are publicly accessible and linked from footer and checkout to keep customer
            communication explicit.
          </p>
        </div>

        <div className="store-policy-grid">
          {policyCards.map((policy) => (
            <Link key={policy.href} href={policy.href} className="store-policy-card">
              <h2>{policy.title}</h2>
              <p>{policy.summary}</p>
              <span>Read policy</span>
            </Link>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}