import { useCallback, useEffect, useRef, useState } from 'react';


const DEFAULT_EXIT_FALLBACK_DURATION = 300;


function cssTimeToMilliseconds(value) {
  const normalized = value.trim();
  if (normalized.endsWith('ms')) return Number.parseFloat(normalized) || 0;
  if (normalized.endsWith('s')) return (Number.parseFloat(normalized) || 0) * 1000;
  return 0;
}


function hasActiveTransformTransition(element) {
  const styles = window.getComputedStyle(element);
  const properties = styles.transitionProperty.split(',').map(value => value.trim());
  const durations = styles.transitionDuration.split(',').map(cssTimeToMilliseconds);
  const delays = styles.transitionDelay.split(',').map(cssTimeToMilliseconds);
  const index = properties.findIndex(property => property === 'transform' || property === 'all');
  if (index < 0) return false;

  return (
    durations[index % durations.length]
    + delays[index % delays.length]
  ) > 0;
}


export function useExitPresence(value, fallbackDuration = DEFAULT_EXIT_FALLBACK_DURATION) {
  const [renderedValue, setRenderedValue] = useState(value);
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const timeoutRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const clearExitTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const completeExit = useCallback(event => {
    if (event && event.target !== event.currentTarget) return;
    if (
      event
      && event.propertyName !== 'transform'
      && hasActiveTransformTransition(event.currentTarget)
    ) return;
    if (valueRef.current || !isExitingRef.current) return;

    clearExitTimeout();
    isExitingRef.current = false;
    setRenderedValue(null);
    setIsExiting(false);
  }, [clearExitTimeout]);

  useEffect(() => {
    if (value) {
      clearExitTimeout();
      isExitingRef.current = false;
      setRenderedValue(value);
      setIsExiting(false);
      return undefined;
    }

    if (!renderedValue) {
      isExitingRef.current = false;
      setIsExiting(false);
      return undefined;
    }

    isExitingRef.current = true;
    setIsExiting(true);
    clearExitTimeout();
    timeoutRef.current = window.setTimeout(completeExit, fallbackDuration);

    return () => {
      clearExitTimeout();
    };
  }, [clearExitTimeout, completeExit, fallbackDuration, renderedValue, value]);

  useEffect(() => () => {
    clearExitTimeout();
  }, [clearExitTimeout]);

  return {
    completeExit,
    isExiting,
    renderedValue,
    shouldRender: Boolean(renderedValue),
  };
}
