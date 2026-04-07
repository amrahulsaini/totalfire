import StoreShell from "../../_store/StoreShell";

export const metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using TotalFire ecommerce storefront.",
};

export default function TermsPolicyPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <article className="store-policy-content">
          <h1>Terms of Use</h1>
          <p>Effective Date: 06 April 2026</p>

          <h2>1. Merchant Scope</h2>
          <p>
            This storefront offers physical gaming gear, digital tournament products, and branded
            merchandise under TotalFire.in.
          </p>

          <h2>2. Pricing and Availability</h2>
          <p>
            Prices are displayed in INR. Product availability is subject to stock status shown at the
            time of checkout.
          </p>

          <h2>3. Order Acceptance</h2>
          <p>
            Orders are considered confirmed after successful payment authorization and merchant review.
            We reserve the right to cancel fraudulent or duplicate transactions.
          </p>

          <h2>4. User Obligations</h2>
          <p>
            Customers must provide accurate billing and shipping details. Abuse of promotions or
            deliberate payment chargeback misuse may result in account restrictions.
          </p>

          <h2>5. Legal Contact</h2>
          <p>
            For legal queries, contact team@totalfire.in and mention your order ID or invoice number.
          </p>
        </article>
      </section>
    </StoreShell>
  );
}