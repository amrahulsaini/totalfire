export default function FeaturesSection() {
  const features = [
    {
      icon: "🎯",
      title: "Skill-Based Earnings",
      description: "Your rewards are based purely on your skill. Better gameplay means bigger rewards.",
      color: "var(--accent-primary)",
    },
    {
      icon: "🔒",
      title: "Secured by Razorpay",
      description: "All payments are processed through Razorpay ensuring complete security and reliability.",
      color: "var(--accent-blue)",
    },
    {
      icon: "⚡",
      title: "Instant Payouts",
      description: "Win and get your rewards quickly. No unnecessary delays or hidden charges.",
      color: "var(--accent-secondary)",
    },
    {
      icon: "🏆",
      title: "Multiple Modes",
      description: "BR Solo, Duo, Squad, CS 1v1/2v2/4v4, LW 1v1/2v2 — pick your battlefield.",
      color: "var(--accent-green)",
    },
    {
      icon: "💰",
      title: "Per Kill Rewards",
      description: "Earn money for every kill in BR modes. More kills = more earnings.",
      color: "var(--accent-purple)",
    },
    {
      icon: "🛡️",
      title: "Fair Play Guaranteed",
      description: "Anti-cheat measures and fair matchmaking ensure an even playing field for everyone.",
      color: "var(--accent-primary)",
    },
  ];

  return (
    <section className="py-24" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading animate-fade-in-up">
            Why <span className="fire-text">TotalFire</span>?
          </h2>
          <p className="section-subheading animate-fade-in-up stagger-1">
            The most trusted esports platform with secure payments and instant rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass-card p-6 animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="feature-icon mb-4" style={{ background: `${feature.color}15` }}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
