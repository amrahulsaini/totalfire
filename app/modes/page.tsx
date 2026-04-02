import type { Metadata } from "next";
import ModesShowcase from "../components/ModesShowcase";
import { Flame, Swords, Dog, Lock, Target, XCircle, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "All Tournament Modes",
  description: "Browse all esports tournament modes — BR Solo, Duo, Squad, CS 1v1, 2v2, 4v4, LW 1v1, 2v2. Join and compete for real money.",
};

export default function ModesPage() {
  return (
    <div className="page-enter pt-24 pb-20" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="section-heading">
            Tournament <span className="fire-text">Modes</span>
          </h1>
          <p className="section-subheading">
            Choose from 8 different game modes. Every entry fee contributes to your skill-based rewards.
            All payments are secured via Razorpay. No refunds once registered.
          </p>
        </div>

        {/* Category Filters Banner */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="px-5 py-2 rounded-full text-sm font-bold cursor-default flex items-center gap-1.5"
            style={{ background: "rgba(230,57,70,0.1)", color: "var(--accent-primary)" }}>
            <Flame size={16} /> Battle Royale
          </span>
          <span className="px-5 py-2 rounded-full text-sm font-bold cursor-default flex items-center gap-1.5"
            style={{ background: "rgba(29,53,87,0.1)", color: "var(--accent-blue)" }}>
            <Swords size={16} /> Clash Squad
          </span>
          <span className="px-5 py-2 rounded-full text-sm font-bold cursor-default flex items-center gap-1.5"
            style={{ background: "rgba(108,71,160,0.1)", color: "var(--accent-purple)" }}>
            <Dog size={16} /> Lone Wolf
          </span>
        </div>

        {/* All Modes */}
        <ModesShowcase />

        {/* Info Banner */}
        <div className="mt-16 glass-card p-8 text-center">
          <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Important Information</h3>
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-2"><Lock size={14} /> Payments secured by Razorpay</span>
            <span className="flex items-center gap-2"><Target size={14} /> Skill-based earnings only</span>
            <span className="flex items-center gap-2"><XCircle size={14} /> No refunds after registration</span>
            <span className="flex items-center gap-2"><DollarSign size={14} /> Entry fee mandatory per player</span>
          </div>
        </div>
      </div>
    </div>
  );
}
