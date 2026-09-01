'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Mic, Square } from 'lucide-react';

type SpeechResult = ArrayLike<{ transcript: string }>;
type SpeechEvent = { results: ArrayLike<SpeechResult> };
type BrowserRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => BrowserRecognition;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

const noBrowserEvents = () => () => {};

function speechIsSupported() {
  if (typeof window === 'undefined') return false;
  const speechWindow = window as SpeechWindow;
  return Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition);
}

function insertTranscript(value: string, start: number, end: number, transcript: string) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const prefix = before && !/\s$/.test(before) ? ' ' : '';
  const suffix = after && !/^\s/.test(after) ? ' ' : '';
  return `${before}${prefix}${transcript}${suffix}${after}`;
}

export function VoiceInputButton({ textareaId, value, onChange }: { textareaId: string; value: string; onChange: (value: string) => void }) {
  const supported = useSyncExternalStore(noBrowserEvents, speechIsSupported, () => false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const baseValueRef = useRef('');
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    baseValueRef.current = value;
    selectionRef.current = {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    };

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || document.documentElement.lang || 'en-US';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) transcript += event.results[index][0]?.transcript ?? '';
      const { start, end } = selectionRef.current;
      onChange(insertTranscript(baseValueRef.current, start, end, transcript));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <button aria-label={listening ? 'Stop voice input' : 'Start voice input'} aria-pressed={listening} className="voice-input-button" data-listening={listening} onClick={toggleListening} type="button">
      {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
      <span>{listening ? 'Listening…' : 'Speak'}</span>
    </button>
  );
}
