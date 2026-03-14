"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, Shield, Clock, Copy, Lock, Github, ArrowRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import PasteForm from "@/components/paste-form"
import { ThemeToggle } from '@/components/theme-toggle'
import Footer from '@/components/footer'

function Header({ setMode }: { setMode: (mode: "select" | "create" | "view") => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/50 backdrop-blur-2xl">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); setMode("select") }}>
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold tracking-tighter">
              N
            </div>
            <span className="text-xl font-bold tracking-tight">NullBin</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/marvlock/nullbin" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <div className="w-px h-4 bg-border hidden sm:block"></div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function HomeContent() {
  const [mode, setMode] = useState<"select" | "create" | "view">("select")
  const [pasteId, setPasteId] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'create' || modeParam === 'view') {
      setMode(modeParam)
    }
  }, [searchParams])

  const handleViewPaste = () => {
    if (!pasteId.trim()) {
      toast.error("Please enter a paste ID or URL")
      return
    }

    const input = pasteId.trim()
    
    if (input.includes('://')) {
      try {
        const url = new URL(input)
        const pathAndHash = url.pathname + url.hash
        router.push(pathAndHash)
        return
      } catch {
        toast.error("Invalid URL format")
        return
      }
    }
    
    const urlMatch = input.match(/paste\/([a-zA-Z0-9]+(?:#.*)?)/)
    if (urlMatch) {
      router.push(`/paste/${urlMatch[1]}`)
      return
    }
    
    router.push(`/paste/${input}`)
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen flex flex-col grid-bg dark:bg-black bg-white">
        <Header setMode={setMode} />
        <main className="flex-1 container mx-auto py-12 px-4 isolate">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create Paste</h1>
                <p className="text-muted-foreground">Zero-knowledge end-to-end encryption by default.</p>
              </div>
            </div>
            <div className="glass-panel rounded-xl shadow-xl p-1">
              <div className="bg-background rounded-lg border border-border/40">
                <PasteForm />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (mode === "view") {
    return (
      <div className="min-h-screen flex flex-col grid-bg dark:bg-black bg-white">
        <Header setMode={setMode} />
        <main className="flex-1 container mx-auto py-20 px-4 isolate flex items-center justify-center">
          <div className="w-full max-w-lg mb-20">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 ring-1 ring-primary/20 shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Decrypt Paste</h1>
              <p className="text-muted-foreground text-lg">
                Enter the snippet ID or the full URL to decrypt the contents locally on your device.
              </p>
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <Label htmlFor="paste-id" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Snippet Locator</Label>
                  <Input
                    id="paste-id"
                    placeholder="e.g. 7fB9a2 or https://nullbin.com/paste/..."
                    value={pasteId}
                    onChange={(e) => setPasteId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleViewPaste()}
                    className="h-14 bg-background/50 border-border/50 text-lg px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all font-mono"
                  />
                </div>
                <Button 
                  onClick={handleViewPaste} 
                  className="w-full h-14 text-base font-medium rounded-xl group/btn"
                >
                  <span>Decrypt Document</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col grid-bg dark:bg-black bg-white">
      <Header setMode={setMode} />

      <main className="flex-1 isolate">
        {/* Subtle radial gradients for background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-[-1]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-50 dark:opacity-20 animate-pulse-glow" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen opacity-50 dark:opacity-20 animate-pulse-glow" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-32 pb-24 sm:pt-40 sm:pb-32 flex flex-col items-center text-center">
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[1.1]">
            Share code with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 dark:to-primary/40">
              zero trust.
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mb-12 font-medium leading-relaxed">
            A developer-first pastebin designed for the modern web. 
            Client-side encrypted, brutally fast, and beautifully minimal.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button 
              onClick={() => setMode("create")}
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base shadow-xl rounded-xl group"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>New Snippet</span>
            </Button>
            <Button 
              onClick={() => setMode("view")}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base border border-border/50 shadow-sm rounded-xl hover:bg-muted"
            >
              <Lock className="w-5 h-5 mr-2" />
              <span>Decrypt Paste</span>
            </Button>
          </div>
        </section>

        {/* Features / Bento Grid */}
        <section className="container mx-auto px-4 py-24 border-t border-border/40 bg-background/40 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Engineered for privacy.</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                NullBin operates on a zero-knowledge architecture. The decryption keys never leave your browser, making it mathematically impossible for us to read your snippets.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 ring-1 ring-primary/20">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">End-to-End Encrypted</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AES-256-GCM encryption happens completely locally. We receive only standard ciphertexts.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Copy className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
                  <Copy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Frictionless Sharing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The encryption key is embedded in the URL fragment. Just share the link—we handle the rest.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-24 h-24" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6 ring-1 ring-green-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Ephemeral By Default</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Snippets auto-destruct based on your settings. Zero permanent storage, zero liabilities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen grid-bg bg-background flex flex-col items-center justify-center text-muted-foreground font-mono">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
