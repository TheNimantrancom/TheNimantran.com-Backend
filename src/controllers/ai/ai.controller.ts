import { Request, Response } from 'express';

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
// import sharp from 'sharp';
import path from 'path';

console.log("Key at init:", process.env.ANTHROPIC_API_KEY);
const callGemini = async (prompt: string): Promise<string> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const data: any = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return text;
};
// ─── AI Image Generation via Hugging Face (Free) ────────────────────────────
// export const generateImage = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { prompt, width = 512, height = 512, style = 'realistic' } = req.body;

//     if (!prompt) {
//       res.status(400).json({ error: 'Prompt is required' });
//       return;
//     }

//     const stylePrompts: Record<string, string> = {
//       realistic: 'photorealistic, high quality, 8k, detailed',
//       illustration: 'digital illustration, vector art style, clean lines, vibrant colors',
//       watercolor: 'watercolor painting, soft edges, artistic, beautiful',
//       'flat-design': 'flat design, minimal, simple shapes, professional',
//       vintage: 'vintage retro style, aged, classic, nostalgic',
//       '3d-render': '3D render, blender, octane render, high quality',
//       abstract: 'abstract art, geometric shapes, modern art',
//       sketch: 'pencil sketch, hand drawn, artistic, line art',
//     };

//     const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.realistic}, no text, no watermark`;

//     const HF_API_URL =
//       'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';

//     const response = await fetch(HF_API_URL, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         inputs: enhancedPrompt,
//         parameters: {
//           width: Math.min(width, 1024),
//           height: Math.min(height, 1024),
//           num_inference_steps: 30,
//           guidance_scale: 7.5,
//         },
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();

//       if (response.status === 503) {
//         res.status(503).json({
//           error: 'AI model is warming up. Please try again in 20 seconds.',
//           retryAfter: 20,
//         });
//         return;
//       }

//       throw new Error(`HF API error: ${errorText}`);
//     }

//     const imageBuffer = Buffer.from(await response.arrayBuffer());

//     const filename = `ai-gen-${Date.now()}.png`;
//     const filepath = path.join(__dirname, '../../uploads', filename);

//     await sharp(imageBuffer).png().toFile(filepath);

//     res.json({
//       success: true,
//       imageUrl: `/uploads/${filename}`,
//       prompt: enhancedPrompt,
//     });
//   } catch (error) {
//     console.error('generateImage error:', error);
//     res.status(500).json({ error: 'Image generation failed', details: String(error) });
//   }
// };

// ─── AI Background Removal (Server-side using Remove.bg OR Sharp) ─────────────
// export const removeBackground = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       res.status(400).json({ error: 'Image file is required' });
//       return;
//     }

//     const inputPath = req.file.path;
//     const outputFilename = `nobg-${Date.now()}.png`;
//     const outputPath = path.join(__dirname, '../../uploads', outputFilename);

//     // Option 1: Use Remove.bg API (best quality, needs API key)
//     if (process.env.REMOVEBG_API_KEY) {
//       const formData = new FormData();
//       formData.append('image_file', fs.createReadStream(inputPath));
//       formData.append('size', 'auto');

//       const response = await fetch('https://api.remove.bg/v1.0/removebg', {
//         method: 'POST',
//         headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY },
//         body: formData,
//       });

//       if (response.ok) {
//         const buffer = await response.buffer();
//         fs.writeFileSync(outputPath, buffer);
//         fs.unlinkSync(inputPath);
//         res.json({ success: true, imageUrl: `/uploads/${outputFilename}` });
//         return;
//       }
//     }

//     // Option 2: Fallback - use Sharp for basic processing
//     // Note: True AI background removal requires ML model. 
//     // For production, use @imgly/background-removal on frontend (browser-based, free)
//     await sharp(inputPath)
//       .png()
//       .toFile(outputPath);

//     fs.unlinkSync(inputPath);
//     res.json({
//       success: true,
//       imageUrl: `/uploads/${outputFilename}`,
//       note: 'For best background removal, the browser-side AI tool is used automatically'
//     });
//   } catch (error) {
//     console.error('removeBackground error:', error);
//     res.status(500).json({ error: 'Background removal failed' });
//   }
// };
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}
export const getDesignSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, purpose, industry, mood } = req.body;

    if (!category || !purpose || !industry || !mood) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const prompt = `
You are a professional graphic designer specializing in print design.

Generate design suggestions for:
- Category: ${category}
- Purpose: ${purpose}
- Industry: ${industry}
- Mood/Style: ${mood}

Return ONLY valid JSON in this exact structure:

{
  "colorPalettes": [
    {
      "name": "Palette name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "description": "Brief description"
    }
  ],
  "fontPairings": [
    {
      "heading": "Font Name",
      "body": "Font Name",
      "style": "Style description",
      "googleFonts": true
    }
  ],
  "layoutSuggestions": [
    {
      "name": "Layout name",
      "description": "What to put where",
      "elements": ["element1", "element2"]
    }
  ],
  "copywritingSuggestions": [
    {
      "element": "Headline/Tagline/CTA",
      "text": "Suggested text",
      "tip": "Why this works"
    }
  ],
  "designTips": ["tip1", "tip2", "tip3"]
}
`;

 const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }),
  }
);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const data: any = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const suggestions = JSON.parse(jsonMatch[0]);

    res.json({ success: true, data: suggestions });

  } catch (error) {
    console.error("getDesignSuggestions error:", error);
    res.status(500).json({ error: "Failed to get design suggestions" });
  }
};

// ─── AI Color Palette Generator ──────────────────────────────────────────────
export const generateColorPalette = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, mood, count = 5 } = req.body;

    const prompt = `
Generate ${count} beautiful, harmonious color palettes for "${keyword}" with mood "${mood}".

Return ONLY valid JSON:

{
  "palettes": [
    {
      "name": "Palette name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "hex": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "description": "Brief evocative description",
      "usage": "When to use this palette"
    }
  ]
}
`;

    const text = await callGemini(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const result = JSON.parse(jsonMatch[0]);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate palette" });
  }
};

// ─── AI Font Suggestions ──────────────────────────────────────────────────────
export const getFontSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry, mood, style } = req.body;

    const prompt = `
Suggest Google Fonts pairings for:
Industry: "${industry}"
Mood: "${mood}"
Style: "${style}"

Return ONLY valid JSON:

{
  "pairings": [
    {
      "name": "Pairing name",
      "heading": "Google Font Name",
      "subheading": "Google Font Name",
      "body": "Google Font Name",
      "description": "Why this works",
      "vibe": "luxury|modern|playful|bold|elegant|minimal"
    }
  ]
}
`;

    const text = await callGemini(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const result = JSON.parse(jsonMatch[0]);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get font suggestions" });
  }
};

// ─── AI Text Enhancer ─────────────────────────────────────────────────────────
export const enhanceText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, tone, purpose } = req.body;

    const prompt = `
Enhance this text for print design.

Original: "${text}"
Tone: "${tone}"
Purpose: "${purpose}"

Return ONLY valid JSON:

{
  "variations": [
    { "text": "variation 1", "style": "Bold & Direct" },
    { "text": "variation 2", "style": "Elegant & Refined" },
    { "text": "variation 3", "style": "Playful & Creative" },
    { "text": "variation 4", "style": "Minimal & Clean" }
  ]
}
`;

    const generated = await callGemini(prompt);

    const jsonMatch = generated.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const result = JSON.parse(jsonMatch[0]);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to enhance text" });
  }
};