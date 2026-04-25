import Link from "next/link";
import StoreShell from "../_store/StoreShell";

export const metadata = {
  title: "Ecommerce Dashboard",
  description: "Operational dashboard showing orders, payment status, and delivery visibility.",
};

const metrics = [
  { label: "Gross Sales (MTD)", value: "INR 14.2L", delta: "+18.4%" },
  { label: "Orders Completed", value: "1,982", delta: "+12.1%" },
  { label: "Successful Payments", value: "99.2%", delta: "+0.6%" },
  { label: "Avg. Fulfillment", value: "1.6 days", delta: "-0.4 days" },
];

const recentOrders = [
  {
    id: "TF-APR-2026-001",
    customer: "Arjun K",
    items: "Ignition Pro 75 + Pass Plus",
    amount: "INR 9,498",
    payment: "Paid",
    status: "Packed",
  },
  {
    id: "TF-APR-2026-002",
    customer: "Megha S",
    items: "Gift Card 5000",
    amount: "INR 5,000",
    payment: "Paid",
    status: "Delivered (Digital)",
  },
  {
    id: "TF-APR-2026-003",
    customer: "Nikhil P",
    items: "BlastCore Chair",
    amount: "INR 12,499",
    payment: "Paid",
    status: "In Transit",
  },
  {
    id: "TF-APR-2026-004",
    customer: "Riya M",
    items: "Phoenix Headset + Jersey",
    amount: "INR 6,498",
    payment: "Pending",
    status: "Awaiting Payment",
  },
];

export default function DashboardPage() {
  return (
    <StoreShell>
      <section className="store-section-tight">
        <div className="store-section-head left">
          <h1>Ecommerce Dashboard</h1>
          <p>
            Merchant-style summary view for catalog, transaction health, and fulfillment traceability.
          </p>
        </div>

        <div className="store-metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <h2>{metric.label}</h2>
              <strong>{metric.value}</strong>
              <span>{metric.delta}</span>
            </article>
          ))}
        </div>

        <div className="store-table-wrap">
          <div className="store-table-head">
            <h2>Recent Orders</h2>
            <Link href="/shop" className="store-ghost-btn compact">
              Back to Catalog
            </Link>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.items}</td>
                  <td>{order.amount}</td>
                  <td>{order.payment}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </StoreShell>
  );
}
