import { HfInference } from '@huggingface/inference';

export class TranscriptionService {
  private hf: HfInference;

  constructor() {
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key is required');
    }
    this.hf = new HfInference(apiKey);
  }

  async transcribeAudio(
    audioBuffer: Buffer, 
    targetLanguage: string = 'en',
  ) {
    try {
      // const audioArrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
      const audioArrayBuffer = new Uint8Array(audioBuffer).buffer;

      const result = await this.hf.automaticSpeechRecognition({
        model: 'openai/whisper-large-v3-turbo',
        data: audioArrayBuffer as ArrayBuffer,
        // language: targetLanguage,
        // return_timestamps: true,
        // chunk_length_s: maxChunkDuration // Handle longer files by chunking
      });
      // Process chunks if multiple
      const transcription = Array.isArray(result)
        ? result.map(chunk => 
            `[${this.formatTimestamp(chunk.timestamp[0])} - ${this.formatTimestamp(chunk.timestamp[1])}] ${chunk.text}`
          ).join('\n\n')
        : result.text || 'No transcription available';

      return {
        transcription,
        detectedLanguage: targetLanguage
      };
    } catch (error) {
      console.error('Transcription error:', error);
      
      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }
      
      throw new Error('Transcription failed due to an unknown error');
    }
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [hours, minutes, secs]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' }, 
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ar', name: 'Arabic' }
    ];
  }
}