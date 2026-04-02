import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with TotalFire. Reach out for support, queries, or partnerships at team@totalfire.in.",
};

export default function ContactPage() {
  return (
    <div className="page-enter pt-24 pb-20" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="section-heading">
            Get In <span className="fire-text">Touch</span>
          </h1>
          <p className="section-subheading">
            Have a question, issue, or just want to say hello? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(230,57,70,0.08)" }}>
                  📧
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Email Us</h3>
                  <a href="mailto:team@totalfire.in" className="text-sm font-medium"
                    style={{ color: "var(--accent-primary)" }}>
                    team@totalfire.in
                  </a>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                For support queries, partnership inquiries, or general feedback.
                We typically respond within 24 hours.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(29,53,87,0.08)" }}>
                  🕐
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Support Hours</h3>
                  <p className="text-sm" style={{ color: "var(--accent-blue)" }}>24/7 Email Support</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Our team is available round the clock via email. We prioritize tournament-related issues.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(108,71,160,0.08)" }}>
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Quick Info</h3>
                </div>
              </div>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-center gap-2">🔒 All payments secured by Razorpay</li>
                <li className="flex items-center gap-2">❌ No refunds after registration</li>
                <li className="flex items-center gap-2">🎯 Skill-based earnings only</li>
                <li className="flex items-center gap-2">💰 Entry fee mandatory for all players</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Send us a Message</h2>
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Subject</label>
                <input
                  type="text"
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Message</label>
                <textarea
                  rows={5}
                  placeholder="Describe your query in detail..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors resize-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <button type="submit" className="fire-btn w-full justify-center !py-3">
                Send Message
              </button>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Or email us directly at{" "}
                <a href="mailto:team@totalfire.in" style={{ color: "var(--accent-primary)" }}>team@totalfire.in</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
