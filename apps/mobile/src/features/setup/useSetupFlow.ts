import { useCallback, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { SetupAnswers } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function useSetupFlow() {
  const router = useRouter();
  const { signIn, saveSetup } = useAuth();

  const [step, setStep] = useState<StepIndex>(0);
  const [answers, setAnswers] = useState<SetupAnswers>({
    level: null, placementLevel: null, reason: null, name: '', email: '', password: '',
  });
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback(<K extends keyof SetupAnswers>(key: K, value: SetupAnswers[K]) => {
    setAnswers((s) => ({ ...s, [key]: value }));
    setError(null);
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    if (step === 0) {
      if (router.canGoBack()) router.back();
      else router.replace('/(auth)/login' as Href);
      return;
    }
    setStep((s) => (s - 1) as StepIndex);
  }, [step, router]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.register({
        email: answers.email.trim().toLowerCase(),
        password: answers.password,
        display_name: answers.name.trim(),
      });
      if (answers.level && answers.reason) {
        await api.user.updatePreferences(res.data.access_token, {
          self_level: answers.level,
          learning_reason: answers.reason,
          placement_level: answers.placementLevel,
        });
        await saveSetup(answers.level, answers.reason);
      }
      await signIn(res.data);
      setStep(5);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, saveSetup, signIn]);

  const next = useCallback(() => {
    if (step === 0) {
      if (!answers.level) return;
      setStep(1);
    } else if (step === 1) {
      if (!answers.reason) return;
      setStep(2);
    } else if (step === 2) {
      if (!answers.name.trim()) return;
      setStep(3);
    } else if (step === 3) {
      if (!EMAIL_RE.test(answers.email.trim())) {
        setError('invalid_email');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (answers.password.length < 8) { setError('weak'); return; }
      if (answers.password !== confirm) { setError('mismatch'); return; }
      void submit();
    } else if (step === 5) {
      router.replace('/(tabs)/home');
    }
  }, [step, answers, confirm, submit, router]);

  const canProceed = (() => {
    if (step === 0) return !!answers.level;
    if (step === 1) return !!answers.reason;
    if (step === 2) return answers.name.trim().length > 0;
    if (step === 3) return answers.email.trim().length > 0;
    if (step === 4) return answers.password.length >= 8 && confirm.length >= 8;
    return true;
  })();

  return {
    step, answers, confirm, error, submitting, canProceed,
    update, setConfirm, next, goBack,
  };
}
