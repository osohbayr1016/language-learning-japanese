/**
 * A small animation runtime standing in for Reanimated.
 *
 * Reanimated exists to run animations on the native UI thread — a problem the
 * browser does not have. Rather than ship its web runtime for the one component
 * that uses it, this reimplements the handful of APIs that component needs on
 * requestAnimationFrame.
 *
 * Inert stubs were the obvious shortcut, but a shared value that never moves
 * leaves the success celebration stuck at `scale: 0` — invisible, and silently
 * so. These actually tween.
 */
import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native-web';

type Easing = (t: number) => number;

type TimingConfig = { duration?: number; easing?: Easing };

const ANIM = Symbol('anim');

type Step =
  | { [ANIM]: 'timing'; to: number; duration: number; easing: Easing }
  | { [ANIM]: 'sequence'; steps: Step[] }
  | { [ANIM]: 'delay'; ms: number; step: Step }
  | { [ANIM]: 'repeat'; step: Step; times: number };

/** One global version counter; any value change re-renders animated styles. */
let version = 0;
const listeners = new Set<() => void>();

function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export type SharedValue<T> = { value: T };

class Value implements SharedValue<number> {
  private current: number;
  private cancel: (() => void) | null = null;

  constructor(initial: number) {
    this.current = initial;
  }

  get value(): number {
    return this.current;
  }

  set value(next: number | Step) {
    this.cancel?.();
    this.cancel = null;
    if (typeof next === 'number') {
      this.current = next;
      bump();
      return;
    }
    this.cancel = run(next, (v) => {
      this.current = v;
      bump();
    }, this.current);
  }
}

/** Drives one step, reporting each frame. Returns a cancel function. */
function run(step: Step, emit: (v: number) => void, from: number): () => void {
  let stopped = false;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const finish = (fns: (() => void)[]) => () => {
    stopped = true;
    cancelAnimationFrame(frame);
    if (timer) clearTimeout(timer);
    fns.forEach((f) => f());
  };

  if (step[ANIM] === 'timing') {
    const start = performance.now();
    const delta = step.to - from;
    const tick = (now: number) => {
      if (stopped) return;
      const t = step.duration <= 0 ? 1 : Math.min(1, (now - start) / step.duration);
      emit(from + delta * step.easing(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return finish([]);
  }

  if (step[ANIM] === 'delay') {
    let inner: (() => void) | null = null;
    timer = setTimeout(() => {
      if (!stopped) inner = run(step.step, emit, from);
    }, step.ms);
    return finish([() => inner?.()]);
  }

  if (step[ANIM] === 'repeat') {
    let inner: (() => void) | null = null;
    let left = step.times;
    const once = (start: number) => {
      if (stopped || left === 0) return;
      left -= 1;
      inner = run(step.step, emit, start);
      const dur = durationOf(step.step);
      timer = setTimeout(() => once(start), dur);
    };
    once(from);
    return finish([() => inner?.()]);
  }

  // sequence
  let inner: (() => void) | null = null;
  let index = 0;
  let cursor = from;
  const next = () => {
    if (stopped || index >= step.steps.length) return;
    const current = step.steps[index++];
    inner = run(current, emit, cursor);
    cursor = targetOf(current, cursor);
    timer = setTimeout(next, durationOf(current));
  };
  next();
  return finish([() => inner?.()]);
}

function durationOf(step: Step): number {
  if (step[ANIM] === 'timing') return step.duration;
  if (step[ANIM] === 'delay') return step.ms + durationOf(step.step);
  if (step[ANIM] === 'repeat') return durationOf(step.step) * Math.max(1, step.times);
  return step.steps.reduce((sum, s) => sum + durationOf(s), 0);
}

function targetOf(step: Step, fallback: number): number {
  if (step[ANIM] === 'timing') return step.to;
  if (step[ANIM] === 'delay') return targetOf(step.step, fallback);
  if (step[ANIM] === 'repeat') return targetOf(step.step, fallback);
  return step.steps.length ? targetOf(step.steps[step.steps.length - 1], fallback) : fallback;
}

const linear: Easing = (t) => t;

export function useSharedValue(initial: number): SharedValue<number> {
  return React.useRef(new Value(initial)).current;
}

export function withTiming(to: number, config: TimingConfig = {}): number {
  return {
    [ANIM]: 'timing',
    to,
    duration: config.duration ?? 300,
    easing: config.easing ?? linear,
  } as unknown as number;
}

export function withSequence(...steps: number[]): number {
  return { [ANIM]: 'sequence', steps: steps as unknown as Step[] } as unknown as number;
}

export function withDelay(ms: number, step: number): number {
  return { [ANIM]: 'delay', ms, step: step as unknown as Step } as unknown as number;
}

export function withRepeat(step: number, times = 1): number {
  return { [ANIM]: 'repeat', step: step as unknown as Step, times } as unknown as number;
}

export function withSpring(to: number): number {
  return withTiming(to, { duration: 320, easing: (t) => 1 - Math.pow(1 - t, 3) });
}

export function useAnimatedStyle<T extends object>(factory: () => T): T {
  React.useSyncExternalStore(
    subscribe,
    () => version,
    () => version
  );
  return factory();
}

export function runOnJS<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}

export const Easing = {
  linear,
  ease: (t: number) => t * t * (3 - 2 * t),
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  in: (f: Easing = linear) => f,
  out:
    (f: Easing = linear): Easing =>
    (t) =>
      1 - f(1 - t),
  inOut:
    (f: Easing = linear): Easing =>
    (t) =>
      t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2,
};

/**
 * `Animated.View` etc. Styles from useAnimatedStyle are plain objects here, so
 * the react-native-web components accept them unchanged.
 */
const Animated = {
  View,
  Text,
  ScrollView,
  Image,
  createAnimatedComponent: <P,>(C: React.ComponentType<P>) => C,
};

export default Animated;
