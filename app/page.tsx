import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ModesShowcase from "./components/ModesShowcase";
import Link from "next/link";

export default function Home() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <HeroSection />

      {/* Game Modes Preview */}
      <section className="py-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">
              Choose Your <span className="fire-text">Battlefield</span>
            </h2>
            <p className="section-subheading">
              Multiple game modes with real money rewards. Pick your favorite and start competing today.
            </p>
          </div>
          <ModesShowcase limit={4} />
          <div className="text-center mt-12">
            <Link href="/modes" className="outline-btn text-lg">
              View All Modes →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* How it Works */}
      <section className="py-24" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">
              How It <span className="blue-text">Works</span>
            </h2>
            <p className="section-subheading">
              Get started in 3 simple steps and begin earning from your gaming skills.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Choose a Mode", desc: "Browse our 7+ tournament modes and pick the one that suits your playstyle.", icon: "🎮" },
              { step: "02", title: "Pay & Join", desc: "Pay the entry fee securely via Razorpay and get matched instantly.", icon: "💳" },
              { step: "03", title: "Play & Earn", desc: "Compete, get kills, win matches, and earn real money rewards.", icon: "🏆" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-xs font-bold mb-2" style={{ color: "var(--accent-primary)" }}>STEP {s.step}</div>
                <h3 className="text-xl font-bold mb-2 text-white">{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 relative overflow-hidden" style={{ background: "var(--bg-card)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
            style={{ background: "var(--accent-primary)", filter: "blur(120px)" }} />
        </div>
        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Ready to <span className="fire-text">Dominate</span>?
          </h2>
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            Join thousands of gamers competing for real rewards. Your next win is just a click away.
          </p>
          <Link href="/modes" className="fire-btn text-lg !py-4 !px-12">
            Join a Tournament Now
          </Link>
        </div>
      </section>
    </div>
  );
}
