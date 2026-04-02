"use client";

import { useState } from "react";

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is TotalFire?",
        a: "TotalFire is India's premier esports tournament platform where players can compete in various game modes like Battle Royale, Clash Squad, and Lone Wolf for real money rewards based on their skills.",
      },
      {
        q: "Is TotalFire legal?",
        a: "Yes, TotalFire operates as a skill-based gaming platform. All earnings are based purely on player skill and performance, not luck or chance.",
      },
      {
        q: "Who can participate in tournaments?",
        a: "Any gamer who meets the entry requirements can join. All players must pay the mandatory entry fee before joining any tournament match.",
      },
    ],
  },
  {
    category: "Payments & Refunds",
    questions: [
      {
        q: "How are payments processed?",
        a: "All payments on TotalFire are processed securely through Razorpay, India's leading payment gateway. Your financial data is fully encrypted and protected.",
      },
      {
        q: "Is there a refund policy?",
        a: "No, all entry fees are strictly non-refundable once paid. Please make sure you want to participate before paying the entry fee.",
      },
      {
        q: "When do I get my rewards?",
        a: "Rewards are processed after match results are verified by our admin team. Earnings are transferred to your account as soon as verification is complete.",
      },
      {
        q: "Is the entry fee per player?",
        a: "Yes, the entry fee is mandatory for each individual player. In team modes (Duo, Squad, 2v2, 4v4), every team member must pay their own entry fee.",
      },
    ],
  },
  {
    category: "Game Modes",
    questions: [
      {
        q: "What game modes are available?",
        a: "We offer 8 modes: BR Ranked Solo (48 players), BR Duo (2×24), BR Squad (4×12), CS 1v1, CS 2v2, CS 4v4, LW 1v1, and LW 2v2. Each has different entry fees and reward structures.",
      },
      {
        q: "How do BR mode rewards work?",
        a: "In Battle Royale modes, you earn money per kill — ₹20/kill for Solo and Duo, ₹15/kill for Squad. The more eliminations you get, the more you earn.",
      },
      {
        q: "How do CS and LW mode rewards work?",
        a: "In Clash Squad and Lone Wolf modes, there are no per-kill rewards. Instead, the winning player or team receives a fixed prize. For example, CS 1v1 winner gets ₹40, CS 4v4 winning team members each get ₹45.",
      },
      {
        q: "What happens if I don't join on time?",
        a: "If you fail to join the match on time, you forfeit your entry fee. No exceptions or refunds are given for late joins.",
      },
    ],
  },
  {
    category: "Fair Play & Rules",
    questions: [
      {
        q: "What happens if someone uses hacks or cheats?",
        a: "We have a zero-tolerance policy for cheating. Any player caught using hacks, mods, or unauthorized tools will be permanently banned and their entry fee forfeited.",
      },
      {
        q: "How are results verified?",
        a: "All match results are verified by our admin team using in-game screenshots and data. Admin decisions on results are final.",
      },
      {
        q: "Is teaming allowed in solo BR?",
        a: "No, teaming with other players in solo Battle Royale mode is strictly prohibited and will result in a ban.",
      },
    ],
  },
  {
    category: "Support",
    questions: [
      {
        q: "How do I contact support?",
        a: "You can reach our support team by emailing team@totalfire.in. We are available 24/7 and typically respond within 24 hours.",
      },
      {
        q: "What if I have a dispute about match results?",
        a: "Contact us at team@totalfire.in with your match details and screenshots. Our admin team will review the dispute and make a final decision.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ background: open ? "var(--bg-secondary)" : "var(--bg-card)" }}
      >
        <span className="font-semibold text-sm md:text-base pr-4" style={{ color: "var(--text-primary)" }}>{q}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--accent-primary)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in" style={{ background: "var(--bg-card)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="page-enter pt-24 pb-20" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="section-heading">
            Frequently Asked <span className="fire-text">Questions</span>
          </h1>
          <p className="section-subheading">
            Everything you need to know about TotalFire tournaments, payments, and rewards.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {faqs.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full" style={{ background: "var(--gradient-fire)" }} />
                <span style={{ color: "var(--text-primary)" }}>{cat.category}</span>
              </h2>
              <div className="space-y-3">
                {cat.questions.map((faq) => (
                  <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center glass-card p-8">
          <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Still have questions?</h3>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
          <a href="mailto:team@totalfire.in" className="fire-btn">
            📧 Email team@totalfire.in
          </a>
        </div>
      </div>
    </div>
  );
}
