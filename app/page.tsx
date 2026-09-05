"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Camera, Sparkles, Key, ExternalLink, CheckCircle, Copy, Volume2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ImageCaptioningApp() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [needsSetup, setNeedsSetup] = useState(false)
  const [captionSource, setCaptionSource] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setCaption("")
        setError("")
        setNeedsSetup(false)
        setCaptionSource("")
      }
      reader.readAsDataURL(file)
    }
  }

  // Resize image to max 512px for fast API transmission
  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const MAX = 512
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        } else {
          resolve(base64Str)
        }
      }
      img.onerror = () => resolve(base64Str)
    })
  }

  const generateCaption = async () => {
    if (!selectedImage) return
    setIsLoading(true)
    setError("")
    setCaption("")
    setNeedsSetup(false)
    setCaptionSource("")

    try {
      const optimizedImage = await resizeImage(selectedImage)

      const response = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: optimizedImage }),
      })

      let data: any = {}
      try { data = await response.json() } catch (_) {}

      if (response.ok && data.caption) {
        setCaption(data.caption)
        setCaptionSource(data.source || "")
      } else if (data.needsSetup) {
        setNeedsSetup(true)
        setError(data.error || "API key not set up.")
      } else {
        setError(data.error || "Failed to generate caption. Please try again.")
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setCaption("")
        setError("")
        setNeedsSetup(false)
        setCaptionSource("")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCopy = () => {
    if (caption) {
      navigator.clipboard.writeText(caption)
      // Could add a toast here if shadcn toast was set up, but simple copy is fine
    }
  }

  const handleSpeak = () => {
    if (caption && "speechSynthesis" in window) {
      window.speechSynthesis.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(caption)
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 font-sans selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#09090b] to-[#09090b] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10 pt-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl mb-4 border border-purple-500/20">
            <Camera className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            AI Vision Captioning
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Upload any image and let our advanced neural networks generate a highly accurate, natural language description instantly.
          </p>
        </div>

        {/* API Setup Banner */}
        {needsSetup && (
          <Card className="mb-8 border-purple-500/30 bg-purple-500/5 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Key className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-100 mb-2 text-lg">Setup Required: Connect AI Provider</h3>
                  <p className="text-sm text-purple-200/70 mb-4 leading-relaxed">
                    To generate captions, you need to provide a free Hugging Face API token in your environment variables.
                  </p>
                  <ol className="text-sm text-purple-200/80 space-y-2 mb-5 list-decimal list-inside font-medium">
                    <li>Go to <a href="https://huggingface.co/settings/tokens" target="_blank" className="text-purple-400 hover:underline">huggingface.co/settings/tokens</a> and create a Free Read Token.</li>
                    <li>Copy the token (starts with <code className="bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/50">hf_...</code>)</li>
                    <li>Paste it into your <code className="bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/50">.env.local</code> file as <code className="bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/50">HF_API_TOKEN</code></li>
                    <li>Restart the development server.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Upload className="h-5 w-5 text-purple-400" />
                Upload Image
              </CardTitle>
              <CardDescription className="text-zinc-400">Drag and drop or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedImage ? (
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-2xl border border-zinc-800"
                    />
                    <p className="text-sm text-zinc-500 group-hover:text-purple-400 transition-colors">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-8">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-zinc-300">Drop an image here</p>
                      <p className="text-sm text-zinc-500 mt-1">Supports JPG, PNG, WebP</p>
                    </div>
                  </div>
                )}
              </div>
              <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button
                onClick={generateCaption}
                disabled={!selectedImage || isLoading}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 py-6 text-lg font-medium rounded-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing Vision Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Caption Results */}
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Analysis
              </CardTitle>
              <CardDescription className="text-zinc-400">Generated description of your image</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {error && !needsSetup && (
                <Alert className="mb-4 bg-red-950/50 border-red-900 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {caption ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-6 shadow-inner relative group">
                    <Label className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Generated Output</Label>
                    <p className="text-2xl text-zinc-100 mt-3 leading-relaxed font-light pr-12">{caption}</p>
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={handleCopy} className="p-2 bg-zinc-800 hover:bg-purple-600 rounded-lg text-zinc-300 hover:text-white transition-colors" title="Copy text">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={handleSpeak} className="p-2 bg-zinc-800 hover:bg-purple-600 rounded-lg text-zinc-300 hover:text-white transition-colors" title="Read aloud">
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {captionSource && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-950/30 w-fit px-3 py-1.5 rounded-full border border-zinc-800/50">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Powered by {captionSource === "gemini" ? "Google Gemini 1.5" : "Hugging Face BLIP"}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Sparkles className="h-10 w-10 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500 font-medium">
                    Waiting for image input...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm">
            Powered by Next.js 15, Tailwind CSS, and Hugging Face Computer Vision models.
          </p>
        </div>
      </div>
    </div>
  )
}
