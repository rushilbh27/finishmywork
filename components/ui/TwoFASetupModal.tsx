import React, { useState } from "react";
import { motion } from "framer-motion";
// import { useToast } from "@/hooks/use-toast"; // Uncomment when wiring up
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

export default function TwoFASetupModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  // const { toast } = useToast();

  // Placeholder: simulate API
  const handleGenerate = async () => {
    setLoading(true);
    setTimeout(() => {
      setSecret("JBSWY3DPEHPK3PXP");
      setOtpauthUrl("otpauth://totp/FinishMyWork:demo@finishmywork.app?secret=JBSWY3DPEHPK3PXP&issuer=FinishMyWork");
      setStep(2);
      setLoading(false);
    }, 800);
  };

  const handleVerify = async () => {
    setLoading(true);
    setTimeout(() => {
      if (code === "123456") {
        // toast({ title: "2FA enabled!", variant: "success" });
        setStep(3);
        setLoading(false);
        onEnabled();
      } else {
        // toast({ title: "Invalid code", variant: "destructive" });
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl px-8 py-10 max-w-md w-full flex flex-col items-center"
      >
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Enable Two-Factor Authentication</h2>
            <p className="text-white/80 mb-6 text-center">Scan the QR code with your authenticator app or enter the secret manually.</p>
            <div className="bg-white/10 rounded-lg p-4 mb-4 flex flex-col items-center">
              {/* Placeholder QR */}
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-2">QR</div>
              <div className="text-xs text-white/80 break-all">{secret || "••••••••••••••••"}</div>
            </div>
            <button
              className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold shadow-lg transition hover:scale-105"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Secret"}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Enter 6-digit Code</h2>
            <p className="text-white/80 mb-6 text-center">Enter the code from your authenticator app.</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="text-center tracking-widest text-2xl px-4 py-2 rounded-lg bg-white/20 text-white mb-4 outline-none border border-white/20 focus:border-indigo-400 transition"
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              autoFocus
            />
            <button
              className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold shadow-lg transition hover:scale-105"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-white mb-2 text-center">2FA Enabled!</h2>
            <p className="text-white/80 mb-6 text-center">Two-factor authentication is now active for your account.</p>
            <button
              className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold shadow-lg transition hover:scale-105"
              onClick={onClose}
            >
              Done
            </button>
          </>
        )}
        <button className="absolute top-4 right-4 text-white/60 hover:text-white text-xl" onClick={onClose}>&times;</button>
      </motion.div>
    </div>
  );
}
