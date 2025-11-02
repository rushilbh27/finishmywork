'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BookOpen, Coins, Shield } from "lucide-react";
import { CursorGlow } from "@/components/CursorGlow";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { WaitlistCounter } from "@/components/WaitlistCounter";



type ComingSoonFeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  index: number;
};

function ComingSoonFeatureCard({
  icon: Icon,
  title,
  desc,
  index,
}: ComingSoonFeatureCardProps) {
  const gradientPos = useGlobalGradient();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-lg p-6 md:p-7 group cursor-pointer hover:bg-black/40 transition-all duration-300"
      whileHover={{ scale: 1.02, y: -4 }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: 2,
          background: `linear-gradient(${gradientPos}deg, #9333EA, #4F46E5, #9333EA)`,
          backgroundSize: "200% 200%",
          filter: "blur(1px)",
          opacity: 0.8,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />

      <div className="relative z-10 flex items-start gap-4">
        <motion.div
          className="rounded-xl p-3 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #9333EA, #4F46E5)",
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}


// -------------------- FEATURES SECTION --------------------
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
      title: "P2P Direct Payments.",
      desc: "Direct payments, zero commission, fair reviews.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <ComingSoonFeatureCard
            key={f.title}
            icon={f.icon}
            title={f.title}
            desc={f.desc}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

// -------------------- GRADIENT ANIMATION --------------------
function useGlobalGradient(): number {
  const [angle, setAngle] = useState(45);

  useEffect(() => {
    let frame: number;
    const start = Date.now();

    function animate() {
      const elapsed = (Date.now() - start) / 1000;
      const newAngle = 75 + 45 * Math.sin(elapsed * 0.5);
      setAngle(newAngle);
      frame = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return angle;
}


// -------------------- HOW IT WORKS SECTION --------------------
function ComingSoonHowItWorks() {
  const gradientPos = useGlobalGradient();
  const steps = [
    { title: "Sign Up", desc: "Create your FinishMyWork profile in seconds." },
    { title: "Post/Browse", desc: "List tasks or find ones that match your skills." },
    { title: "Connect", desc: "Chat, clarify scope, and get aligned quickly." },
    { title: "Earn", desc: "Deliver quality work and get paid securely." },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-lg p-6 md:p-7 cursor-pointer hover:bg-black/40 transition-all duration-300"
            whileHover={{ scale: 1.02, y: -4 }}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding: 2,
                background: `linear-gradient(${gradientPos}deg, #9333EA, #4F46E5, #9333EA)`,
                backgroundSize: "200% 200%",
                filter: "blur(1px)",
                opacity: 0.8,
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
            
            <div className="relative z-10 flex items-start gap-4">
              <motion.div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #9333EA, #4F46E5)",
                  color: "white",
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {i + 1}
              </motion.div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// -------------------- MAIN PAGE --------------------
export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [college, setCollege] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((res) => res.json())
      .then((data) => setWaitlistCount(data.count))
      .catch(() => setWaitlistCount(0));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, city, college }),
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

      {/* Subtle grid background */}
      <motion.div
        className="fixed inset-0 opacity-[0.1] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Glow effects */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-32 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Main */}
      <main className="relative z-20 flex flex-col items-center justify-center w-full px-6 py-24">
        {/* Live waitlist counter */}
          <WaitlistCounter />


        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl font-semibold mb-6 gradient-text leading-tight text-center"
        >
          Launching Soon{" "}
          <img
            src="/edfew.svg"
            alt="Rocket"
            className="inline-block h-[1em] w-auto ml-2 align-middle"
          />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-white max-w-2xl mx-auto text-lg mb-10 text-center"
        >
          FinishMyWork — where students outsource the grind & take back their
          freedom. Join our waitlist to get early access and updates.
        </motion.p>

{/* Waitlist form */}
<motion.form
  onSubmit={handleSubmit}
  className="w-full max-w-md glass p-6 rounded-2xl flex flex-col gap-4 shadow-glow border border-white/10 backdrop-blur-2xl"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3, duration: 0.8 }}
>
  {/* Email */}
  <input
    type="email"
    required
    placeholder="Your email address"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
    disabled={loading || success}
  />

  {/* City (required) */}
  <input
    type="text"
    required
    placeholder="Your city"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
    disabled={loading || success}
  />

  {/* College (optional) */}
  <input
    type="text"
    placeholder="College name (optional)"
    value={college}
    onChange={(e) => setCollege(e.target.value)}
    className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
    disabled={loading || success}
  />

  {/* Phone (optional) */}
  <input
    type="tel"
    placeholder="Phone number (optional)"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    className="px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
    disabled={loading || success}
  />

          <div className="relative">
<button
  type="submit"
  disabled={loading || success}
  className="relative mt-2 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-lg shadow-glow hover:scale-105 transition-transform disabled:opacity-60 w-full overflow-hidden"
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  {loading ? "Joining..." : success ? "Joined!" : "Join the Waitlist"}

  {/* ⚡️ Dramatic shine effect */}
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ x: '-150%', opacity: 0 }}
    animate={{
      x: isHovered ? '150%' : '-150%',
      opacity: isHovered ? [0, 1, 0.6, 0] : 0,
      scale: isHovered ? [1, 1.2, 1] : 1,
    }}
    transition={{
      duration: 0.8,
      ease: 'easeInOut',
    }}
    style={{
      background:
        'linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.6) 50%, transparent 55%)',
      filter: 'blur(2px)',
    }}
  />
</button>


          </div>

          {error && <div className="text-red-400 text-sm mt-2 text-center">{error}</div>}
          {success && (
            <div className="text-green-400 text-center w-full">
              You’re on the waitlist! 🎉
            </div>
          )}
        </motion.form>
      </main>

      {/* Footer Sections */}
      <div className="relative z-20 w-full">
        <ComingSoonFeatures />
        <ComingSoonHowItWorks />
        <PublicFooter />
      </div>
    </div>
  );
}
