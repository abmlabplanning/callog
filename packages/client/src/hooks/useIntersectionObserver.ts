import { useEffect, useRef, useCallback } from 'react';

export function useIntersectionObserver(callback: () => void, threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) cbRef.current(); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
