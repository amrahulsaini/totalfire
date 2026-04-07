import StoreShell from "../../_store/StoreShell";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy disclosures for TotalFire ecommerce storefront.",
};

export default function PrivacyPolicyPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <article className="store-policy-content">
          <h1>Privacy Policy</h1>
          <p>Effective Date: 06 April 2026</p>

          <h2>1. Data We Collect</h2>
          <p>
            We collect name, contact number, email address, shipping details, and transactional metadata
            required for processing ecommerce orders.
          </p>

          <h2>2. How Data Is Used</h2>
          <p>
            Data is used to validate purchases, deliver products, send invoices, and provide customer
            support. We do not sell personal data to third parties.
          </p>

          <h2>3. Payment Data</h2>
          <p>
            Payment processing is handled through Razorpay. Card and UPI credentials are processed by
            the gateway and are not stored in plaintext on this storefront.
          </p>

          <h2>4. Retention and Security</h2>
          <p>
            Order records are retained for financial and support obligations. Access is limited to
            authorized operations personnel.
          </p>

          <h2>5. Support</h2>
          <p>
            For privacy concerns, contact team@totalfire.in with subject line &quot;Privacy Request&quot;.
          </p>
        </article>
      </section>
    </StoreShell>
  );
}