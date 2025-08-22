// Voice Service using Node.js Backend with Google Cloud Speech-to-Text
export interface VoiceRecognitionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  language?: string;
}

export interface VoiceLanguage {
  code: string;
  name: string;
  native: string;
  script: string;
  speechCode: string;
}

// Supported languages with speech recognition codes
export const supportedVoiceLanguages: VoiceLanguage[] = [
  { code: 'en', name: 'English', native: 'English', script: 'Latin', speechCode: 'en-US' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', script: 'Devanagari', speechCode: 'hi-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali', speechCode: 'bn-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu', speechCode: 'te-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil', speechCode: 'ta-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari', speechCode: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati', speechCode: 'gu-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada', speechCode: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam', speechCode: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', speechCode: 'pa-IN' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia', speechCode: 'or-IN' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', script: 'Assamese', speechCode: 'as-IN' }
];

class VoiceService {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onTranscriptionResult: ((result: VoiceRecognitionResult) => void) = () => {};
  private onError: ((error: string) => void) = () => {};
  private currentLanguage: string = 'en';

  // Check if voice recording is supported
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Start recording audio
  async startRecording(languageCode: string): Promise<void> {
    try {
      this.currentLanguage = languageCode;
      
      if (this.isRecording) {
        this.stopRecording();
      }

      // Check if media devices are supported
      if (!this.isSupported()) {
        throw new Error('Voice recording is not supported in this browser. Please use a modern browser with microphone access.');
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAudioRecording();
        this.isRecording = false;
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.onError('Audio recording failed. Please try again.');
        this.isRecording = false;
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          this.onError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          this.onError('No microphone found. Please connect a microphone and try again.');
        } else {
          this.onError(`Recording failed: ${error.message}`);
        }
      } else {
        this.onError('Failed to start recording. Please try again.');
      }
      this.isRecording = false;
    }
  }

  // Stop recording
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  // Process the recorded audio
  private async processAudioRecording(): Promise<void> {
    try {
      if (this.audioChunks.length === 0) {
        this.onError('No audio recorded. Please try speaking again.');
        return;
      }

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
      
      // Show processing message
      this.onTranscriptionResult({
        text: 'Processing audio...',
        isFinal: false
      });

      // Send to backend API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('targetLanguage', this.currentLanguage);

      const response = await fetch('/api/speech/recognize', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.text) {
        // Send final result
        this.onTranscriptionResult({
          text: result.text,
          isFinal: true,
          confidence: result.confidence,
          language: result.language
        });
      } else {
        this.onError('No speech detected. Please try speaking again.');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          this.onError('Network error. Please check your connection and try again.');
        } else if (error.message.includes('HTTP 500')) {
          this.onError('Server error. Please try again later.');
        } else if (error.message.includes('HTTP 413')) {
          this.onError('Audio file too large. Please try a shorter recording.');
        } else {
          this.onError(`Processing failed: ${error.message}`);
        }
      } else {
        this.onError('Failed to process audio. Please try again.');
      }
    }
  }

  // Check if currently recording
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  // Set error callback
  setErrorCallback(callback: (error: string) => void): void {
    this.onError = callback;
  }

  // Set transcription callback
  setTranscriptionCallback(callback: (result: VoiceRecognitionResult) => void): void {
    this.onTranscriptionResult = callback;
  }

  // Test backend connectivity
  async testBackendConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/speech/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const voiceService = new VoiceService();
