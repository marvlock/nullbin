"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Share2, Eye, EyeOff, Code2 } from "lucide-react"
import { encryptData, generateShareableLink } from "@/lib/crypto"
import { languageOptions, getLanguageFromFilename } from "@/lib/syntax"
import { toast } from "sonner"

const expiryOptions = [
  { value: "1m", label: "1 minute" },
  { value: "5m", label: "5 minutes" },
  { value: "10m", label: "10 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" },
  { value: "45m", label: "45 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "1d", label: "1 day" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "never", label: "Never" },
]

export function PasteForm() {
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("text")
  const [expiry, setExpiry] = useState("1h")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const detectedLanguage = getLanguageFromFilename(file.name)
    setLanguage(detectedLanguage)
    setTitle(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error("Please enter some content")
      return
    }

    setIsLoading(true)

    try {
      const { encryptedData, key, iv, salt } = await encryptData(content, password)

      const response = await fetch("/api/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || undefined,
          content: encryptedData,
          language,
          expiry,
          password: password ? "protected" : undefined,
          iv,
          salt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create paste")
      }
      
      const { id } = await response.json()
      const shareableLink = generateShareableLink(id, key, iv, salt)

      try {
        await navigator.clipboard.writeText(shareableLink)
        toast.success("Paste created cleanly!", {
          description: "Shareable link copied to clipboard. Automatically decrypting..."
        })
      } catch (clipboardError) {
        console.warn("Clipboard copy failed:", clipboardError)
      }

      window.location.assign(shareableLink)
    } catch (error) {
      console.error("Error creating paste:", error)
      toast.error("Failed to create paste. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full mx-auto p-4 sm:p-8 animate-fade-in flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Configure Snippet</h2>
          <p className="text-muted-foreground text-sm mt-1">Adjust encryption, expiry, and language details.</p>
        </div>
        <div className="flex items-center gap-2">
           <Code2 className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Filename or description"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 bg-background data-[state=open]:bg-background/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Upload File (optional)</Label>
            <div className="relative group">
              <Input
                id="file"
                type="file"
                onChange={handleFileUpload}
                accept="text/*,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.scss,.json,.xml,.yml,.yaml,.toml,.md,.sql,.sh,.ps1,.dockerfile,.vue,.svelte,.r,.m,.lua,.pl,.hs,.clj,.ex,.erl,.dart,.sol,.graphql,.diff"
                className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 focus:ring-0 cursor-pointer pt-2"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Expires In</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                {expiryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password (optional)</Label>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Access key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center py-2">
            <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Content</Label>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-border/50 focus-within:ring-1 focus-within:border-primary focus-within:ring-primary transition-all group shadow-sm bg-muted/20">
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r border-border/50 flex flex-col items-center py-4 text-xs font-mono text-muted-foreground opacity-50 select-none pointer-events-none z-10">
                {Array.from({ length: 15 }).map((_, i) => (
                   <span key={i} className="leading-6 mb-[1px]">{i + 1}</span>
                ))}
             </div>
             <Textarea
                id="content"
                placeholder="Paste or type your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm leading-6 tracking-wide border-0 focus-visible:ring-0 shadow-none pl-16 pt-4 pb-4 rounded-none resize-y bg-transparent relative z-20"
                required
             />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            className="w-full sm:w-auto h-12 px-8 shadow-md rounded-xl font-semibold" 
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Encrypting & Saving...</span>
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-5 w-5" />
                <span>Publish Snippet</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PasteForm
