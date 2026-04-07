import StoreShell from "../../_store/StoreShell";

export const metadata = {
  title: "Refund Policy",
  description: "Refund and return conditions for TotalFire ecommerce products.",
};

export default function RefundPolicyPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <article className="store-policy-content">
          <h1>Refund Policy</h1>
          <p>Effective Date: 06 April 2026</p>

          <h2>1. Physical Products</h2>
          <p>
            Returns can be requested within 7 days of delivery for damaged, defective, or incorrect
            products. Items must be unused and in original packaging.
          </p>

          <h2>2. Digital Products</h2>
          <p>
            Digital codes, memberships, and tournament passes are non-refundable once delivered or
            activated.
          </p>

          <h2>3. Refund Processing</h2>
          <p>
            Approved refunds are processed to the original payment method in 5 to 7 business days,
            subject to banking rails.
          </p>

          <h2>4. Cancellation</h2>
          <p>
            Orders may be cancelled prior to shipment. Post-shipment requests follow return and
            replacement rules.
          </p>

          <h2>5. Contact Channel</h2>
          <p>
            To request a return or refund review, email team@totalfire.in with order ID and issue
            evidence.
          </p>
        </article>
      </section>
    </StoreShell>
  );
}