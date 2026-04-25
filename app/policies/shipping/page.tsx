import StoreShell from "../../_store/StoreShell";

export const metadata = {
  title: "Shipping Policy",
  description: "Shipping timelines and logistics terms for TotalFire store orders.",
};

export default function ShippingPolicyPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <article className="store-policy-content">
          <h1>Shipping Policy</h1>
          <p>Effective Date: 06 April 2026</p>

          <h2>1. Dispatch Windows</h2>
          <p>
            Physical products are typically dispatched within 24 to 48 business hours after successful
            payment.
          </p>

          <h2>2. Delivery Timelines</h2>
          <p>
            Metro locations usually receive deliveries in 2 to 4 business days. Non-metro locations may
            require 4 to 7 business days.
          </p>

          <h2>3. Shipping Charges</h2>
          <p>
            Free shipping applies above the threshold shown during checkout. Any additional zone charges
            are displayed before payment confirmation.
          </p>

          <h2>4. Digital Products</h2>
          <p>
            Digital products are delivered instantly via email and dashboard updates. No courier shipment
            applies.
          </p>

          <h2>5. Tracking</h2>
          <p>
            Tracking references are available in the dashboard after package handover to logistics
            partners.
          </p>
        </article>
      </section>
    </StoreShell>
  );
}
