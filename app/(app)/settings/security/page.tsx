import React from "react";
// import { useSession } from "next-auth/react"; // Uncomment when wiring up
// import { Button } from "@/components/ui/button"; // Uncomment when wiring up

export default function SecuritySettingsPage() {
  // const { data: session } = useSession();
  // const twoFactorEnabled = session?.user?.twoFactorEnabled;
  // Placeholder for now:
  const twoFactorEnabled = false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl px-8 py-10 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold text-white mb-6 text-center drop-shadow">Two-Factor Authentication</h1>
        {twoFactorEnabled ? (
          <>
            <p className="text-white/80 mb-4 text-center">2FA is currently <span className="font-semibold text-green-300">enabled</span> on your account.</p>
            <button className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-fuchsia-600 text-white font-semibold shadow-lg transition hover:scale-105">
              Disable 2FA
            </button>
            <p className="text-xs text-red-200 mt-4 text-center">Warning: Disabling 2FA will reduce your account security.</p>
          </>
        ) : (
          <>
            <p className="text-white/80 mb-4 text-center">Protect your account with an extra layer of security.</p>
            <button className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold shadow-lg transition hover:scale-105">
              Enable 2FA
            </button>
          </>
        )}
      </div>
    </div>
  );
}
