# MSpa AquaVision

AI-powered spa pool placement visualization tool using Google Gemini 2.5 Flash Image API.

## Features

- 📸 Image upload (JPEG, PNG, WebP, HEIC up to 20MB)
- 🏊 7 MSpa pool models with filtering by size and shape
- 🤖 AI-powered intelligent placement using Google Gemini
- 🌅 24-hour lighting simulation with New Zealand conditions
- 🎯 Position adjustment controls
- 💾 Download visualizations as images
- 🔗 Direct product links to MSpa website

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/paragondesignz/aquavision.git
   cd aquavision
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Getting a Google Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and use it in your environment variables

## Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Add environment variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` with your actual API key
   - Select "Production" environment
3. **Deploy**

### Other Platforms

For other hosting platforms (Netlify, Railway, etc.), add the environment variable:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **AI:** Google Gemini 2.5 Flash Image API
- **Styling:** Custom CSS
- **Routing:** React Router DOM

## Project Structure

```
src/
├── components/          # React components
│   ├── ImageUpload.tsx  # Image upload interface
│   ├── SpaSelector.tsx  # Spa model selection
│   └── Visualizer.tsx   # Main AI visualization
├── data/
│   └── spaModels.ts     # MSpa product data
├── pages/               # Page components
├── services/
│   └── geminiService.ts # AI integration
├── styles/              # CSS files
└── types/               # TypeScript definitions
```

## License

This project is for MSpa (Portable Spas New Zealand) visualization purposes.

---

For support or questions, contact: mark@paragondesign.co.nz