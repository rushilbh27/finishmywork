'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// 🔢 Animated Number
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startValue = useRef(0);
  const frame = useRef<number>();

  useEffect(() => {
    const start = startValue.current;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // smooth easeOut
      const current = Math.floor(start + (value - start) * eased);
      setDisplay(current);

      if (progress < 1) frame.current = requestAnimationFrame(update);
      else startValue.current = value;
    };

    cancelAnimationFrame(frame.current!);
    frame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame.current!);
  }, [value, duration]);

  return <span className="font-semibold tabular-nums">{display.toLocaleString()}</span>;
}

// ✅ Waitlist Counter
export function WaitlistCounter() {
  const [count, setCount] = useState<number>(113);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/waitlist/count');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCount(data.count || 113);
      } catch {
        setCount(113);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

   return (
 <motion.div
          animate={{
            boxShadow: [
              "0 0 10px rgba(34,197,94,0.2)",
              "0 0 25px rgba(34,197,94,0.4)",
              "0 0 10px rgba(34,197,94,0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 bg-black/40 border border-green-500/40 rounded-full px-4 py-1 text-sm text-green-400 font-medium mb-6 mx-auto"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>

      <AnimatedNumber value={count} />
      <span>people on the waitlist!</span>
    </motion.div>
  );
}