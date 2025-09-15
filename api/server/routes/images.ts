import type { RequestHandler } from "express";

// Generate an image using Google Imagen (data URL response)
async function generateWithImagen(prompt: string): Promise<string | null> {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const { stdout: token } = await execAsync('gcloud auth print-access-token');
    const accessToken = token.trim();

    const requestBody = {
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "1:1",
        sampleCount: 1,
        enhancePrompt: true,
        addWatermark: false,
        safetySetting: "block_few"
      }
    };

    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      return null;
    }

    const result = await response.json();
    const b64 = result?.predictions?.[0]?.bytesBase64Encoded;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch (err) {
    console.error('Imagen generation failed:', err);
    return null;
  }
}

export const handleImageGenerate: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || prompt.trim().length < 3) return res.status(400).json({ error: 'Prompt is required' });

    const imageDataUrl = await generateWithImagen(prompt.trim());
    if (!imageDataUrl) return res.status(503).json({ error: 'Image generation failed' });

    res.json({ imageUrl: imageDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
};

// Very basic enhancement stub: echoes back the uploaded image (future: call GCP editor/enhancer)
export const handleImageEnhance: RequestHandler = async (req, res) => {
  try {
    // Expect base64 data URL and enhancement settings
    const { imageDataUrl, settings } = req.body as {
      imageDataUrl?: string;
      settings?: {
        brightness?: number; // 0.0 - 2.0 (1 = no change)
        saturation?: number; // 0.0 - 2.0 (1 = no change)
        hue?: number;        // -180 - 180 degrees
        blur?: number;       // 0 - 10 sigma
        sharpen?: number;    // 0 - 3 intensity
      };
    };

    if (!imageDataUrl?.startsWith('data:image')) {
      return res.status(400).json({ error: 'imageDataUrl (data URL) required' });
    }

    const defaultSettings = { brightness: 1, saturation: 1, hue: 0, blur: 0, sharpen: 0 };
    const s = { ...defaultSettings, ...(settings || {}) };

    // Convert data URL to Buffer
    const commaIdx = imageDataUrl.indexOf(',');
    const b64 = imageDataUrl.slice(commaIdx + 1);
    const inputBuffer = Buffer.from(b64, 'base64');

    const sharp = (await import('sharp')).default;
    let pipeline = sharp(inputBuffer);

    // Apply modulate for brightness, saturation, hue
    if (s.brightness !== 1 || s.saturation !== 1 || s.hue !== 0) {
      pipeline = pipeline.modulate({
        brightness: Math.max(0, s.brightness ?? 1),
        saturation: Math.max(0, s.saturation ?? 1),
        hue: Math.max(-180, Math.min(180, s.hue ?? 0))
      });
    }

    // Blur
    if ((s.blur ?? 0) > 0) {
      pipeline = pipeline.blur(Math.min(10, Math.max(0.3, s.blur!)));
    }

    // Sharpen
    if ((s.sharpen ?? 0) > 0) {
      // Sharp sharpen accepts sigma; use value mapping 0-3 -> 0.1-2
      const sigma = Math.min(2, Math.max(0.1, (s.sharpen! / 3) * 2));
      pipeline = pipeline.sharpen(sigma);
    }

    const output = await pipeline.png().toBuffer();
    const outDataUrl = `data:image/png;base64,${output.toString('base64')}`;
    res.json({ imageUrl: outDataUrl });
  } catch (e) {
    console.error('Enhance error:', e);
    res.status(500).json({ error: 'Internal error' });
  }
};

// Background swap using Imagen capability model with automatic background mask
async function bgSwapWithImagen(base64PngOrJpg: string, prompt: string, dilation = 0.03, sampleCount = 1): Promise<string[]> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const { stdout: token } = await execAsync('gcloud auth print-access-token');
  const accessToken = token.trim();

  const instances = [
    {
      prompt,
      referenceImages: [
        {
          referenceType: 'REFERENCE_TYPE_RAW',
          referenceId: 1,
          referenceImage: { bytesBase64Encoded: base64PngOrJpg }
        },
        {
          referenceType: 'REFERENCE_TYPE_MASK',
          referenceId: 2,
          maskImageConfig: { maskMode: 'MASK_MODE_BACKGROUND', dilation }
        }
      ]
    }
  ];

  const parameters = {
    editConfig: { baseSteps: 75 },
    editMode: 'EDIT_MODE_BGSWAP',
    sampleCount
  };

  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-001:predict`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ instances, parameters })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Imagen capability error: ${err}`);
  }

  const json = await response.json();
  const preds = json?.predictions || [];
  const images: string[] = [];
  for (const p of preds) {
    const b64 = p?.bytesBase64Encoded;
    if (b64) images.push(`data:image/png;base64,${b64}`);
  }
  return images;
}

export const handleImageBgSwap: RequestHandler = async (req, res) => {
  try {
    const { imageDataUrl, variant, customPrompt } = req.body as { imageDataUrl?: string; variant?: string; customPrompt?: string };
    if (!imageDataUrl?.startsWith('data:image')) return res.status(400).json({ error: 'imageDataUrl (data URL) required' });

    // Extract base64
    const commaIdx = imageDataUrl.indexOf(',');
    const b64 = imageDataUrl.slice(commaIdx + 1);

    // Preset prompts (extendable)
    const presets: Record<string, string> = {
      standard: 'Place the product on a clean white studio background with soft ambient lighting and natural shadows, professional e-commerce style',
      premium: 'Place the product on a light wooden shelf with soft diffused studio lighting, gentle vignette, natural shadows, premium catalog look',
      festive: 'Place the product on a tasteful festive background with warm tones and subtle celebratory bokeh lights, still life studio lighting, minimal distractions',
      'festive-diwali': 'Place the product on a tasteful Diwali themed background with warm golden tones, subtle diyas/bokeh lights, traditional festive ambiance, clean composition, studio lighting, minimal distractions',
      'festive-holi': 'Place the product on a colorful Holi themed background with soft pastel color powder bokeh, playful yet elegant, bright natural lighting, minimal distractions, keep product clean and uncolored',
      'festive-christmas': 'Place the product on a cozy Christmas themed background with soft fairy lights bokeh, pine/wood accents, gentle snow-like texture, warm ambient lighting, minimal distractions'
    };
    const prompt = (customPrompt && customPrompt.trim().length > 5)
      ? customPrompt.trim()
      : (presets[variant || 'standard'] || presets.standard);

    const images = await bgSwapWithImagen(b64, prompt, 0.03, 1);
    if (!images.length) return res.status(503).json({ error: 'No images returned' });
    res.json({ images });
  } catch (e) {
    console.error('BG swap error:', e);
    res.status(500).json({ error: 'Internal error' });
  }
};
