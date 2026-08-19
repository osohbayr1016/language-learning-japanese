import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useNativeSpeechEvent } from './speechNative';
import { EMPTY_SPEECH_BUFFER } from './speechTypes';
import type { SpeechBuffer, SpeechResult, SpeechState } from './speechTypes';

type Setters = {
  setLiveTranscript: (s: string) => void;
  setResult: Dispatch<SetStateAction<SpeechResult | null>>;
  setErrorMessage: (s: string | null) => void;
  setState: Dispatch<SetStateAction<SpeechState>>;
};

export function useNativeContinuousBindings(
  clearAutoStop: () => void,
  buffer: MutableRefObject<SpeechBuffer>,
  { setLiveTranscript, setResult, setErrorMessage, setState }: Setters
): void {
  useNativeSpeechEvent('start', () => {
    setState('listening');
    setErrorMessage(null);
  });
  useNativeSpeechEvent('end', () => {
    clearAutoStop();
    const buf = buffer.current;
    const transcript = buf.committed.trim() || buf.preview.trim();
    const alternatives = buf.alternatives.filter((a) => a && a !== transcript);
    buffer.current = { ...EMPTY_SPEECH_BUFFER };
    if (transcript) {
      setResult({ transcript, confidence: 0, alternatives });
      setLiveTranscript('');
      setState('idle');
    } else {
      setState((s) => (s === 'error' ? s : 'idle'));
    }
  });
  useNativeSpeechEvent('result', (event) => {
    const e = event as { isFinal: boolean; results?: SpeechResult[] };
    const hypotheses = e.results ?? [];
    const top = hypotheses[0];
    if (!top?.transcript) return;
    const buf = buffer.current;
    if (e.isFinal) {
      const committed = `${buf.committed} ${top.transcript}`.trim();
      buffer.current = {
        committed,
        preview: committed,
        // Keep the whole utterance for each hypothesis of this final segment.
        alternatives: hypotheses
          .map((h) => `${buf.committed} ${h.transcript ?? ''}`.trim())
          .filter(Boolean),
      };
      setLiveTranscript(committed);
    } else {
      const preview = `${buf.committed} ${top.transcript}`.trim();
      buffer.current = { ...buf, preview };
      setLiveTranscript(preview);
    }
  });
  useNativeSpeechEvent('error', (event) => {
    clearAutoStop();
    const e = event as { error: string; message?: string };
    setErrorMessage(e.message ?? e.error);
    setState('error');
  });
}
