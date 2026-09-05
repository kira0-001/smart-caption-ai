import { type NextRequest, NextResponse } from "next/server"

// ─── Google Gemini 1.5 Flash Vision (Free tier: 1500 req/day, ~2s response) ───
async function fetchGeminiVision(base64Data: string, mimeType: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  // 1. Fetch available models for this specific API key
  let availableModels: string[] = []
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (listRes.ok) {
      const listData = await listRes.json()
      if (listData.models) {
        availableModels = listData.models
          .map((m: any) => m.name.replace('models/', ''))
          .filter((n: string) => n.includes('gemini'))
        
        console.log("ALL AVAILABLE MODELS FOR KEY:", availableModels)
      }
    }
  } catch (e) {}

  const bestModel = availableModels.find(m => m.includes('3.6-flash'))
    || availableModels.find(m => m.includes('3.5-flash'))
    || availableModels.find(m => m.includes('3.1-flash'))
    || availableModels.find(m => m.includes('3-flash'))
    || availableModels.find(m => m.includes('flash-latest'))
    || availableModels.find(m => m.includes('flash'))
    || availableModels[0]
    || 'gemini-3.5-flash' // fallback

  console.log("SELECTED MODEL:", bestModel)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: "Describe what is in this image in 1-2 clear sentences. Identify characters, logos, text, animals, people, or objects precisely.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (text && text.length > 5) return text
    } else {
      console.warn(`Gemini model ${bestModel} failed:`, response.status, await response.text())
    }
  } catch (e) {
    console.error(`Gemini fetch error for ${bestModel}:`, e)
  }
  return null
}

// ─── Hugging Face BLIP Vision (Free, ~5-30s without token, needs HF_API_TOKEN for speed) ───
async function fetchHuggingFaceVision(imageBuffer: Buffer): Promise<string | null> {
  const hfToken = process.env.HF_API_TOKEN
  const headers: Record<string, string> = {
    "Content-Type": "application/octet-stream",
  }
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`
  }

  const models = [
    "Salesforce/blip-image-captioning-base",
    "nlpconnect/vit-gpt2-image-captioning",
  ]

  for (const model of models) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers,
        body: imageBuffer,
      })

      if (response.ok) {
        const result = await response.json()
        if (Array.isArray(result) && result[0]?.generated_text) {
          const text = result[0].generated_text.trim()
          if (text.length > 3) {
            return text.charAt(0).toUpperCase() + text.slice(1)
          }
        }
      }
    } catch (e) {
      // Try next model
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const mimeMatch = image.match(/^data:(image\/[\w+]+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"
    const base64Data = image.replace(/^data:image\/[\w+]+;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    // 1. Google Gemini 1.5 Flash — fastest, most accurate (requires GEMINI_API_KEY in .env.local)
    const geminiCaption = await fetchGeminiVision(base64Data, mimeType)
    if (geminiCaption) {
      return NextResponse.json({ caption: geminiCaption, source: "gemini" })
    }

    // 2. Hugging Face BLIP — free fallback (slow without HF_API_TOKEN)
    const hfCaption = await fetchHuggingFaceVision(imageBuffer)
    if (hfCaption) {
      return NextResponse.json({ caption: hfCaption, source: "huggingface" })
    }

    // 3. Signal client that server AI failed — client will show setup guide
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    const hasHfToken = !!process.env.HF_API_TOKEN
    return NextResponse.json({
      needsSetup: !hasGeminiKey,
      error: hasGeminiKey
        ? "AI model is busy. Please try again."
        : "API key required. See setup instructions below.",
    }, { status: 503 })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process image"
    console.error("Caption route error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
