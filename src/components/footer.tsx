import React from 'react'
import { Shield, Lock, Clock, Heart } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold tracking-tighter">
                N
              </div>
              <span className="text-xl font-bold tracking-tight">NullBin</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              A developer-first, zero-knowledge encryption pastebin. 
              Built for speed, privacy, and simplicity.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Safety</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> <span>End-to-End Encrypted</span></div></li>
              <li><div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> <span>Zero Knowledge</span></div></li>
              <li><div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> <span>Auto-Destruct</span></div></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NullBin. No rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>by</span>
            <a href="https://www.marvlock.dev" target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline italic">marvlock</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
