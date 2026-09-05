# 📸 Full-Stack AI Image Captioning 

## 🚀 Overview
This is a production-ready **Next.js 15 Web Application** that leverages Cloud AI to generate highly accurate natural language descriptions of images. Built with an extreme focus on premium UI/UX, the app features a responsive Dark Mode Glassmorphism interface, drag-and-drop uploads, text-to-speech functionality, and seamless integration with state-of-the-art vision models.

## 🧠 Core Architecture
The application is designed as a hybrid ML-Web architecture:
1. **Frontend (React 19 / Next.js 15):** A highly polished, client-side interface built with Tailwind CSS v4, shadcn/ui, and Radix Primitives. It handles image compression and browser-native Text-to-Speech (TTS).
2. **Serverless API (`/api/caption`):** A Next.js API route that securely relays base64 encoded images to cloud vision models.
3. **AI Vision Engine:** The app defaults to **Google Gemini 1.5 Flash Vision** for lightning-fast, highly accurate object and character recognition, with a graceful fallback to **Hugging Face BLIP (Salesforce/blip-image-captioning-large)** if needed.

## 💡 Key Features
- **Intelligent Vision Processing:** Accurately identifies characters, logos, animals, text, and scenery.
- **Premium UI/UX:** Dark mode aesthetics, glassmorphism panels, and smooth framer-motion-style CSS transitions.
- **Client-Side Optimization:** Images are automatically resized and compressed in the browser via HTML5 Canvas before API transmission to ensure sub-2-second generation times.
- **Accessibility & Utility:** Features a 1-click "Copy to Clipboard" and a browser-native "Read Aloud" (Text-to-Speech) integration.

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide Icons, shadcn/ui
- **AI Integration:** Google Generative AI API, Hugging Face Inference API

## 💻 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/image-captioning-ai.git
   cd image-captioning-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up API Keys:**
   Create a `.env.local` file in the root directory and add your free Google AI Studio key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
