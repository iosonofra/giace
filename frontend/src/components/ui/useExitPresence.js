import { useEffect, useRef, useState } from 'react';


const DEFAULT_EXIT_DURATION = 180;


export function useExitPresence(value, duration = DEFAULT_EXIT_DURATION) {
  const [renderedValue, setRenderedValue] = useState(value);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (value) {
      setRenderedValue(value);
      setIsExiting(false);
      return undefined;
    }

    if (!renderedValue) {
      setIsExiting(false);
      return undefined;
    }

    setIsExiting(true);
    timeoutRef.current = window.setTimeout(() => {
      setRenderedValue(null);
      setIsExiting(false);
      timeoutRef.current = null;
    }, duration);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [duration, renderedValue, value]);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  return {
    isExiting,
    renderedValue,
    shouldRender: Boolean(renderedValue),
  };
}
