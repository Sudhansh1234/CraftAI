import { RequestHandler } from "express";
import { SpeechClient } from "@google-cloud/speech";
import { Translate } from "@google-cloud/translate/build/src/v2";
import multer from "multer";
import path from "path";

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Initialize Google Cloud clients
const speechClient = new SpeechClient();
const translateClient = new Translate();

// Language mapping for speech recognition
const speechLanguageMap: { [key: string]: string } = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'bn': 'bn-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'as': 'as-IN'
};

// Language mapping for translation
const translateLanguageMap: { [key: string]: string } = {
  'en': 'en',
  'hi': 'hi',
  'bn': 'bn',
  'te': 'te',
  'ta': 'ta',
  'mr': 'mr',
  'gu': 'gu',
  'kn': 'kn',
  'ml': 'ml',
  'pa': 'pa',
  'or': 'or',
  'as': 'as'
};

export const handleSpeechToText: RequestHandler = async (req, res) => {
  try {
    // Handle file upload
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          error: 'File upload error', 
          details: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No audio file provided' 
        });
      }

      const { targetLanguage = 'en' } = req.body;
      const audioBuffer = req.file.buffer;
      const audioMimeType = req.file.mimetype;

      // Configure speech recognition request
      const audio = {
        content: audioBuffer.toString('base64')
      };

      const config = {
        encoding: audioMimeType.includes('webm') ? 'WEBM_OPUS' : 
                   audioMimeType.includes('mp3') ? 'MP3' : 
                   audioMimeType.includes('wav') ? 'LINEAR16' : 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: speechLanguageMap[targetLanguage] || 'en-US',
        alternativeLanguageCodes: ['en-US', 'hi-IN', 'bn-IN'],
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long',
        useEnhanced: true
      };

      const request = {
        audio: audio,
        config: config,
      };

      // Perform speech recognition
      const [response] = await speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return res.json({
          text: '',
          confidence: 0,
          language: targetLanguage,
          message: 'No speech detected'
        });
      }

      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ');

      const confidence = response.results[0]?.alternatives?.[0]?.confidence || 0;

      // If target language is not English, translate the result
      let translatedText = transcription;
      let detectedLanguage = targetLanguage;

      if (targetLanguage !== 'en' && transcription) {
        try {
          const [translationResponse] = await translateClient.translate(
            transcription, 
            translateLanguageMap[targetLanguage]
          );
          translatedText = translationResponse;
        } catch (translateError) {
          console.warn('Translation failed, returning original text:', translateError);
        }
      }

      res.json({
        text: translatedText,
        originalText: transcription,
        confidence: confidence,
        language: targetLanguage,
        detectedLanguage: detectedLanguage,
        message: 'Speech recognition successful'
      });

    });

  } catch (error) {
    console.error('Speech recognition error:', error);
    res.status(500).json({ 
      error: 'Speech recognition failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Health check endpoint
export const handleSpeechHealth: RequestHandler = async (req, res) => {
  try {
    // Test Google Cloud connectivity
    await speechClient.getProjectId();
    res.json({ 
      status: 'healthy', 
      service: 'Google Cloud Speech-to-Text',
      message: 'Speech service is operational'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'Google Cloud Speech-to-Text',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

