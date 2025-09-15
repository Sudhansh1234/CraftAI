import { RequestHandler } from "express";
import { VertexAI } from "@google-cloud/vertexai";
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Lazy initialization of VertexAI client
let vertexAI: VertexAI | null = null;

const initializeVertexAI = async () => {
  if (!vertexAI) {
    const { VertexAI } = await import("@google-cloud/vertexai");
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });
  }
  return vertexAI;
};

// Function to create real video using Veo 3 API
async function createRealVideoWithVeo3(prompt: string, settings: any): Promise<{ videoPath: string, thumbnailPath: string, operationId: string }> {
  try {
    console.log('🎬 Starting Veo 3 video generation...');
    
    // Create temporary directory for video generation
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const videoId = Date.now().toString();
    const videoPath = path.join(tempDir, `video-${videoId}.mp4`);
    const thumbnailPath = path.join(tempDir, `thumb-${videoId}.png`);
    
    // Initialize VertexAI for prompt enhancement
    const ai = await initializeVertexAI();
    
    // Enhanced prompt for Veo 3
    const enhancedPrompt = await enhancePromptForVeo3(prompt, ai);
    console.log('🎬 Enhanced prompt:', enhancedPrompt);
    
    // Call Veo 3 API to generate video
    const veo3Response = await callVeo3API(enhancedPrompt, settings);
    
    if (veo3Response && veo3Response.operationId) {
      console.log('✅ Veo 3 operation started:', veo3Response.operationId);
      
      // Wait for the operation to complete and get the video
      const videoData = await waitForCompletion(veo3Response.operationId);
      
      if (videoData) {
        // Save the video file
        await writeFile(videoPath, videoData);
        
        // Generate thumbnail
        const thumbnailData = await generateThumbnail();
        await writeFile(thumbnailPath, thumbnailData);
        
        console.log('✅ Video generated successfully');
        return { videoPath, thumbnailPath, operationId: veo3Response.operationId };
      } else {
        throw new Error('No video data received');
      }
    } else {
      throw new Error('No operation ID received');
    }
    
  } catch (error) {
    console.error('❌ Error creating video:', error);
    throw error;
  }
}

// Function to enhance prompt for Veo 3
async function enhancePromptForVeo3(prompt: string, ai: VertexAI): Promise<string> {
  try {
    const model = ai.preview.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const enhancementPrompt = `
      You are a professional video script writer for Veo 3 video generation.
      
      Original story: "${prompt}"
      
      Please enhance this into a detailed, cinematic video prompt for Veo 3 that will create a beautiful, engaging video.
      
      Requirements:
      - Make it descriptive and visual
      - Include camera movements, lighting, and atmosphere
      - Focus on the craft/artisan aspect
      - Keep it under 100 words
      - Make it suitable for video generation
      - Use cinematic language like "Open on", "The camera slowly pans", "Scene transitions to", "A montage follows", "The video culminates in", "Final shot"
      
      Return only the enhanced prompt, nothing else.
    `;
    
    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    const enhancedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Enhanced prompt for video generation';
    
    return enhancedPrompt;
    
  } catch (error) {
    console.warn('⚠️ Could not enhance prompt, using original:', error);
    return prompt;
  }
}

// Function to call Veo 3 API
async function callVeo3API(prompt: string, settings: any): Promise<any> {
  try {
    console.log('🎬 Calling Veo 3 API...');
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1"; // Just use us-central1 as requested
    const modelId = "veo-3.0-generate-001";
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not set');
    }
    
    // Prepare the request payload
    const requestPayload = {
      instances: [{ prompt: prompt }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        durationSeconds: (settings?.duration || 8).toString(),
        personGeneration: "allow_all",
        addWatermark: true,
        includeRaiReason: true,
        generateAudio: true,
        resolution: "720p"
      }
    };
    
    // Get access token
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout: accessToken } = await execAsync('gcloud auth print-access-token');
    const token = accessToken.trim();
    
    // Make the API call
    const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo 3 API failed: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    
    if (responseData.name) {
      return {
        operationId: responseData.name,
        status: 'started'
      };
    } else {
      throw new Error('No operation ID received');
    }
    
  } catch (error) {
    console.error('❌ Veo 3 API call failed:', error);
    throw error;
  }
}

// Function to wait for operation completion
async function waitForCompletion(operationId: string): Promise<Buffer | null> {
  try {
    console.log('🎬 Waiting for completion...');
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1";
    const modelId = "veo-3.0-generate-001";
    const apiEndpoint = `${location}-aiplatform.googleapis.com`;
    
    // Get access token
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout: accessToken } = await execAsync('gcloud auth print-access-token');
    const token = accessToken.trim();
    
    // Since Google doesn't provide a standard operations endpoint for Veo 3,
    // we'll wait a reasonable time and then try fetchPredictOperation directly
    console.log('⏳ Waiting 2 minutes for Veo 3 to process...');
    await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
    
    let attempts = 0;
    const maxAttempts = 30; // Try up to 30 times (5 minutes total)
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🎬 Attempt ${attempts}/${maxAttempts}: Trying fetchPredictOperation...`);
      
      try {
        // Use the EXACT endpoint from your curl example
        const fetchUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        console.log('🎬 Calling fetchPredictOperation at:', fetchUrl);
        
        // Use the EXACT payload structure from your curl example
        const fetchPayload = {
          operationName: operationId
        };
        console.log('🎬 Fetch payload:', JSON.stringify(fetchPayload, null, 2));
        
        const fetchResponse = await fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(fetchPayload)
        });
        
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          console.log('🎬 fetchPredictOperation response:', JSON.stringify(fetchData, null, 2));
          
          // Check if we have video data
          const videoData = await extractVideo(fetchData, token);
          if (videoData) {
            console.log('✅ Video data retrieved successfully!');
            return videoData;
          } else {
            console.log('⏳ No video data yet, operation might still be running...');
          }
        } else {
          const errorText = await fetchResponse.text();
          console.log(`❌ fetchPredictOperation failed (attempt ${attempts}):`, fetchResponse.status, errorText);
          
          // If it's a 400 error, the operation might still be running
          if (fetchResponse.status === 400) {
            console.log('⏳ Operation still running, waiting...');
          }
        }
      } catch (error) {
        console.log(`❌ fetchPredictOperation error (attempt ${attempts}):`, error);
      }
      
      // Wait 10 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    throw new Error('Video generation timed out after 7 minutes total');
    
  } catch (error) {
    console.error('❌ Error waiting for completion:', error);
    throw error;
  }
}

// Function to extract video from response
async function extractVideo(response: any, token: string): Promise<Buffer | null> {
  try {
    console.log('🎬 Extracting video from response...');
    console.log('🎬 Response structure:', Object.keys(response));
    
    // Check for video data in various possible formats
    let videoData = null;
    
    // Format 1: Direct video data in response
    if (response.video) {
      videoData = response.video;
      console.log('🎬 Found video data directly in response');
    }
    // Format 2: Video data in predictions (Veo 3 format)
    else if (response.predictions && response.predictions[0]) {
      const prediction = response.predictions[0];
      console.log('🎬 Prediction structure:', Object.keys(prediction));
      
      // Veo 3 specific: look for video content in various fields
      if (prediction.video) {
        videoData = prediction.video;
        console.log('🎬 Found video in predictions.video');
      } else if (prediction.videoData) {
        videoData = prediction.videoData;
        console.log('🎬 Found video in predictions.videoData');
      } else if (prediction.content && prediction.content.video) {
        videoData = prediction.content.video;
        console.log('🎬 Found video in predictions.content.video');
      } else if (prediction.bytes) {
        // Veo 3 might return video as bytes
        videoData = prediction.bytes;
        console.log('🎬 Found video in predictions.bytes');
      } else if (prediction.data) {
        // Veo 3 might return video as data
        videoData = prediction.data;
        console.log('🎬 Found video in predictions.data');
      } else if (prediction.mimeType === 'video/mp4') {
        // If we have mimeType but no video data, the video might be in a different field
        console.log('🎬 Found video/mp4 mimeType, searching for video content...');
        
        // Look for any field that might contain video data
        for (const [key, value] of Object.entries(prediction)) {
          if (key !== 'mimeType' && typeof value === 'string' && value.length > 100) {
            console.log(`🎬 Found potential video data in field '${key}', length: ${value.length}`);
            videoData = value;
            break;
          }
        }
      }
    }
    // Format 3: Check if response itself contains base64 data
    else if (typeof response === 'string' && response.length > 100) {
      // This might be base64 video data directly
      console.log('🎬 Response appears to be base64 data, length:', response.length);
      try {
        // Try to decode as base64
        const buffer = Buffer.from(response, 'base64');
        if (buffer.length > 1000) { // Reasonable video size
          console.log('✅ Successfully decoded base64 video data, size:', buffer.length);
          return buffer;
        }
      } catch (decodeError) {
        console.log('⚠️ Failed to decode as base64:', decodeError);
      }
    }
    
    if (videoData) {
      console.log('🎬 Video data found, type:', typeof videoData);
      
      // If it's a URL, download it
      if (typeof videoData === 'string' && videoData.startsWith('http')) {
        console.log('🎬 Downloading video from URL:', videoData);
        
        const videoResponse = await fetch(videoData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status}`);
        }
        
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        console.log('✅ Video downloaded successfully, size:', videoBuffer.length);
        return videoBuffer;
      }
      // If it's base64 data, decode it
      else if (typeof videoData === 'string' && videoData.length > 100) {
        console.log('🎬 Decoding base64 video data...');
        
        try {
          const buffer = Buffer.from(videoData, 'base64');
          console.log('✅ Base64 video decoded successfully, size:', buffer.length);
          return buffer;
        } catch (decodeError) {
          console.error('❌ Failed to decode base64 video:', decodeError);
          return null;
        }
      }
      // If it's already a buffer
      else if (Buffer.isBuffer(videoData)) {
        console.log('✅ Video data is already a buffer, size:', videoData.length);
        return videoData;
      }
    }
    
    // If we get here, try to extract any base64-looking data from the response
    console.log('🎬 No direct video data found, searching for base64 content...');
    
    const responseStr = JSON.stringify(response);
    const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/g;
    const potentialBase64 = responseStr.match(base64Pattern);
    
    if (potentialBase64 && potentialBase64.length > 0) {
      console.log('🎬 Found potential base64 data, length:', potentialBase64[0].length);
      
      try {
        const buffer = Buffer.from(potentialBase64[0], 'base64');
        if (buffer.length > 1000) { // Reasonable video size
          console.log('✅ Successfully decoded potential base64 video, size:', buffer.length);
          return buffer;
        }
      } catch (decodeError) {
        console.log('⚠️ Failed to decode potential base64:', decodeError);
      }
    }
    
    console.warn('⚠️ No video data found in response');
    console.log('🎬 Full response for debugging:', JSON.stringify(response, null, 2));
    
    // Special case: if we have mimeType but no video, the video might be in a different response format
    if (response.predictions && response.predictions[0] && response.predictions[0].mimeType === 'video/mp4') {
      console.log('🎬 Detected video/mp4 mimeType but no video data - this suggests the video is ready but in a different format');
      console.log('🎬 Trying to find video in alternative response fields...');
      
      // Look for video in the entire response structure
      const searchForVideo = (obj: any, path: string = ''): any => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string' && value.length > 1000 && !value.includes('{') && !value.includes('[')) {
            console.log(`🎬 Found potential video data at ${currentPath}, length: ${value.length}`);
            return value;
          } else if (typeof value === 'object' && value !== null) {
            const result = searchForVideo(value, currentPath);
            if (result) return result;
          }
        }
        return null;
      };
      
      const foundVideo = searchForVideo(response);
      if (foundVideo) {
        console.log('🎬 Found video data in alternative location, attempting to decode...');
        try {
          const buffer = Buffer.from(foundVideo, 'base64');
          if (buffer.length > 1000) {
            console.log('✅ Successfully decoded alternative video data, size:', buffer.length);
            return buffer;
          }
        } catch (decodeError) {
          console.log('⚠️ Failed to decode alternative video data:', decodeError);
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error extracting video:', error);
    return null;
  }
}

// Function to generate thumbnail
async function generateThumbnail(): Promise<Buffer> {
  const thumbnailContent = `
    <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="240" fill="#667eea"/>
      <text x="160" y="120" font-family="Arial" font-size="16" text-anchor="middle" fill="white">Veo 3 Video</text>
    </svg>
  `;
  
  return Buffer.from(thumbnailContent, 'utf8');
}

export const handleGenerateVideo: RequestHandler = async (req, res) => {
  try {
    const { prompt, language, settings } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🎬 Veo 3 video generation request:", { prompt, language, settings });

    try {
      // Create video using Veo 3
      const { videoPath, thumbnailPath, operationId } = await createRealVideoWithVeo3(prompt, settings);
      
      // Read files
      const videoBuffer = fs.readFileSync(videoPath);
      const thumbnailBuffer = fs.readFileSync(thumbnailPath);
      
      const videoResponse = {
        videoUrl: `data:video/mp4;base64,${videoBuffer.toString("base64")}`,
        thumbnailUrl: `data:image/svg+xml;base64,${thumbnailBuffer.toString("base64")}`,
        duration: settings?.duration || 15,
        status: "completed",
        message: "Veo 3 video generated successfully!",
        operationId: operationId
      };

      console.log("✅ Video generated successfully");
      
      // Clean up
      try {
        await unlink(videoPath);
        await unlink(thumbnailPath);
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up files:", cleanupError);
      }
      
      res.json(videoResponse);
      
    } catch (videoError) {
      console.error("❌ Error creating video:", videoError);
      
      // Simple fallback
      const fallbackResponse = {
        videoUrl: `data:text/html;base64,${Buffer.from('<html><body><h1>Video generation failed</h1></body></html>').toString("base64")}`,
        thumbnailUrl: `data:text/html;base64,${Buffer.from('<html><body><h1>Video generation failed</h1></body></html>').toString("base64")}`,
        duration: settings?.duration || 15,
        status: "failed",
        message: "Video generation failed, showing fallback"
      };
      
      res.json(fallbackResponse);
    }

  } catch (error) {
    console.error("❌ Video generation error:", error);
    res.status(500).json({ 
      error: "Failed to generate video",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const handleVideoStatus: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    res.json({
      videoId,
      status: "processing",
      progress: 75,
      estimatedTimeRemaining: 120,
      api: "Veo 3",
      message: "Video is being generated by Veo 3 AI"
    });

  } catch (error) {
    console.error("❌ Video status check error:", error);
    res.status(500).json({ 
      error: "Failed to check video status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const handleVideoDownload: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    res.json({
      videoId,
      downloadUrl: `/api/videos/${videoId}/stream`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      api: "Veo 3",
      message: "Video download ready when generation completes"
    });

  } catch (error) {
    console.error("❌ Video download error:", error);
    res.status(500).json({ 
      error: "Failed to prepare video download",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Debug endpoint to test Veo 3 API response structure
export const handleDebugVeo3: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Debug: Testing Veo 3 API response structure...');
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1";
    const modelId = "veo-3.0-generate-001";
    const apiEndpoint = `${location}-aiplatform.googleapis.com`;
    
    if (!projectId) {
      return res.status(400).json({ error: "GOOGLE_CLOUD_PROJECT_ID not set" });
    }
    
    // Get access token
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout: accessToken } = await execAsync('gcloud auth print-access-token');
    const token = accessToken.trim();
    
    // Test with a simple prompt
    const testPayload = {
      instances: [{ prompt: "A simple test video" }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        durationSeconds: "5",
        personGeneration: "allow_all",
        addWatermark: true,
        includeRaiReason: true,
        generateAudio: true,
        resolution: "720p"
      }
    };
    
    console.log('🔍 Debug: Calling Veo 3 API...');
    
    // Make the API call
    const apiUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ 
        error: `Veo 3 API failed: ${response.status} - ${errorText}` 
      });
    }
    
    const responseData = await response.json();
    console.log('🔍 Debug: Veo 3 API response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.name) {
      const operationId = responseData.name;
      console.log('🔍 Debug: Operation ID:', operationId);
      
      // Wait a bit and then try fetchPredictOperation
      console.log('🔍 Debug: Waiting 30 seconds before testing fetchPredictOperation...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      const fetchUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
      const fetchPayload = { operationName: operationId };
      
      console.log('🔍 Debug: Testing fetchPredictOperation...');
      
      const fetchResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fetchPayload)
      });
      
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        console.log('🔍 Debug: fetchPredictOperation response:', JSON.stringify(fetchData, null, 2));
        
        // Test our video extraction
        const videoData = await extractVideo(fetchData, token);
        console.log('🔍 Debug: Video extraction result:', videoData ? `Success! Size: ${videoData.length}` : 'Failed');
        
        res.json({
          success: true,
          operationId,
          fetchResponse: fetchData,
          videoExtracted: !!videoData,
          videoSize: videoData ? videoData.length : 0
        });
      } else {
        const errorText = await fetchResponse.text();
        res.json({
          success: false,
          operationId,
          fetchError: `${fetchResponse.status} - ${errorText}`
        });
      }
    } else {
      res.status(500).json({ error: "No operation ID received" });
    }
    
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
