"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

const items = [
  {
    name: "Aisha R.",
    quote: "Helped me earn ₹5000/month tutoring online.",
    role: "B.Tech • AI",
  },
  {
    name: "Marco D.",
    quote: "Found reliable help for lab reports and presentations.",
    role: "MSc • Physics",
  },
  {
    name: "Meera S.",
    quote: "Super smooth payments and friendly community.",
    role: "BA • Economics",
  },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {items.map((t) => (
          <motion.div
            key={t.name}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="glass animated-border p-6 md:p-7 animate-in fade-in duration-500 relative overflow-hidden transition-all hover:shadow-2xl hover:border-purple-500/30 group cursor-pointer">
              {/* Purple backlight glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15), transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 transition-transform duration-300 group-hover:scale-110">
                      <AvatarImage
                        alt={`${t.name} avatar`}
                        src={`/placeholder.svg?height=64&width=64&query=student avatar minimal`}
                      />
                      <AvatarFallback>
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium transition-colors duration-300 group-hover:text-purple-400">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" aria-label="rating 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 transition-colors duration-300 group-hover:fill-purple-500" style={{ color: "var(--brand-blue)" }} aria-hidden="true" />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm text-pretty">{t.quote}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
