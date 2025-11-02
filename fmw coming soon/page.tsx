// Restored from app/coming-soon/page.tsx
'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BookOpen, Coins, Shield } from "lucide-react";
import { CursorGlow } from "../components/CursorGlow";
import { PublicFooter } from "../components/layout/PublicFooter";

// -------------------- FEATURE CARD --------------------
function ComingSoonFeatureCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: any;
  title: string;
  desc: string;
  index: number;
}) {
  const [gradientPos, setGradientPos] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-lg p-6 md:p-7 group cursor-pointer"
    >
      {/* Animated glowing gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: 2,
          background: `linear-gradient(${gradientPos}deg, #9333EA, #4F46E5, #9333EA)`,
          backgroundSize: '200% 200%',
          backgroundPosition: 'center',
          filter: 'blur(2px)',
          opacity: 0.7,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-10 flex items-start gap-4">
        <div
          className="rounded-xl p-2.5"
          style={{
            background: "linear-gradient(90deg, #9333EA, #4F46E5)",
          }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-medium">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

// -------------------- FEATURES WRAPPER --------------------
function ComingSoonFeatures() {
  const features = [
    {
      icon: BookOpen,
      title: "Post and find academic help.",
      desc: "Discover peers for assignments, tutoring, and study partners.",
    },
    {
      icon: Coins,
      title: "Earn by sharing your expertise.",
      desc: "Offer your skills and get paid for quality support.",
    },
    {
      icon: Shield,
      title: "Safe, transparent payments.",
      desc: "Clear expectations, secure transactions, fair reviews.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <ComingSoonFeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            desc={feature.desc}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

// -------------------- HOW IT WORKS --------------------
function ComingSoonHowItWorks() {
  const [gradientPos, setGradientPos] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { title: "Sign Up", desc: "Create your FinishMyWork profile in seconds." },
    { title: "Post/Browse", desc: "List tasks or find ones that match your skills." },
    { title: "Connect", desc: "Chat, clarify scope, and get aligned quickly." },
    { title: "Earn", desc: "Deliver quality work and get paid securely." },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-lg p-6 md:p-7 cursor-pointer"
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding: 2,
                background: `linear-gradient(${gradientPos}deg, #9333EA, #4F46E5, #9333EA)`,
                backgroundSize: '200% 200%',
                backgroundPosition: 'center',
                filter: 'blur(2px)',
                opacity: 0.7,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            />
            <div className="relative z-10 flex items-start gap-4">
  <div
    className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0"
    style={{
      background: "linear-gradient(90deg, #9333EA, #4F46E5)",
      color: "white",
    }}
  >
    {i + 1}
  </div>
  <div>
    <h4 className="font-medium mb-1">{s.title}</h4>
    <p className="text-sm text-muted-foreground">{s.desc}</p>
  </div>
</div>

          </motion.div>
        ))}
      </div>
    </section>
  );
}

// -------------------- MAIN COMING SOON PAGE --------------------
export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setSuccess(true);
      setEmail("");
      setPhone("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <CursorGlow />

      {/* Animated grid background */}
      <motion.div
        className="fixed inset-0 opacity-[0.05] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "40px 40px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Background glow orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-32 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl z-0" />

      {/* Main content */}
      <main className="relative z-20 flex flex-col items-center justify-center w-full px-6 py-24">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl font-semibold mb-6 gradient-text leading-tight text-center"
        >
          Launching Soon{' '}
          <img
            src="/edfew.svg"
            alt="Rocket"
            className="inline-block align-middle h-[1em] w-auto ml-2"
            style={{ verticalAlign: 'middle' }}
          />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-white max-w-2xl mx-auto text-lg mb-10 text-center"
        >
          We’re building something amazing. Join our waitlist to get early access and updates.
        </motion.p>

        {/* Waitlist form */}
        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-md glass p-6 rounded-2xl flex flex-col gap-4 shadow-glow border border-white/10 backdrop-blur-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading || success}
          />
          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading || success}
          />
          <button
            type="submit"
            disabled={loading || success}
            className="mt-2 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-lg shadow-glow hover:scale-105 transition-transform disabled:opacity-60"
          >
            {loading ? "Joining..." : success ? "Joined!" : "Join the Waitlist"}
          </button>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          {success && (
            <div className="text-green-400 text-sm mt-2">
              You’re on the waitlist! 🎉
            </div>
          )}
        </motion.form>
      </main>

      {/* Bottom sections */}
      <div className="relative z-20 w-full">
        <ComingSoonFeatures />
        <ComingSoonHowItWorks />
        <PublicFooter />
      </div>
    </div>
  );
}
