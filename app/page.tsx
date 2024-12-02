'use client'

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Upload, Loader2 } from 'lucide-react';

const TranscriptionUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported languages (expandable)
  const languages = [
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        
        setFile(audioFile);
        setAudioURL(URL.createObjectURL(audioFile));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Could not start recording');
    }
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum file size is 25 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('language', selectedLanguage);

    setLoading(true);
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription request failed');
      }

      const data = await response.json();
      setTranscription(data.transcription);
    } catch (error) {
      setTranscription(`Transcription failed => ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setAudioURL('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg space-y-4">
      {/* Language Selection Dropdown */}
      <div>
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Language:
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload and Recording Section */}
      <div className="flex space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files) {
              const selectedFile = e.target.files[0];
              setFile(selectedFile);
              setAudioURL(URL.createObjectURL(selectedFile));
            }
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-grow flex items-center justify-center p-2 border rounded hover:bg-gray-100 transition"
        >
          <Upload className="mr-2" /> Upload Audio
        </button>
        
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition flex items-center"
          >
            <Mic className="mr-2" /> Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition flex items-center"
          >
            <MicOff className="mr-2" /> Stop
          </button>
        )}
      </div>

      {/* Audio Preview */}
      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} className="w-full" />
          <button 
            onClick={clearFile}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
          >
            Clear Audio
          </button>
        </div>
      )}

      {/* Transcribe Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`w-full p-2 rounded transition flex items-center justify-center ${
          file && !loading 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 animate-spin" /> Transcribing...
          </>
        ) : (
          'Transcribe'
        )}
      </button>

      {/* Transcription Result */}
      {transcription && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
          <p className="text-gray-800">{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionUploader;