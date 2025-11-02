"use client"
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VerifiedPage() {
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: "Email verified",
      description: "You're signed in and ready to go.",
    })
  }, [toast])
  
  return (
    <div className="pt-12 sm:pt-16 max-w-2xl mx-auto px-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="w-full"
      >
        <div className="rounded-2xl border border-border/60 bg-card/85 p-6 sm:p-8 shadow-card backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="mb-6"
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="url(#paint0_linear)" />
                <motion.path
                  d="M26 42L36 52L54 32"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                />
                <defs>
                  <linearGradient id="paint0_linear" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10b981" />
                    <stop offset="1" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <div className="mb-6 space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                You're verified 🎉
              </h1>
              <p className="text-muted-foreground">
                You're all set. You can now post and accept tasks.
              </p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button asChild variant="gradient" size="lg" className="rounded-xl flex-1 sm:flex-initial">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl flex-1 sm:flex-initial">
                <Link href="/tasks">Browse Tasks</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
