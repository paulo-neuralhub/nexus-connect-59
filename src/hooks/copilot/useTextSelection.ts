import { useState, useEffect, useCallback, useRef } from 'react';

interface SelectionState {
  text: string;
  rect: DOMRect | null;
  isActive: boolean;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<SelectionState>({ text: '', rect: null, isActive: false });
  const debounceRef = useRef<number | null>(null);

  const handleSelectionChange = useCallback(() => {
    if (debounceRef.current) cancelAnimationFrame(debounceRef.current);
    
    debounceRef.current = requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(prev => prev.isActive ? { text: '', rect: null, isActive: false } : prev);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelection(prev => prev.isActive ? { text: '', rect: null, isActive: false } : prev);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelection(prev => prev.isActive ? { text: '', rect: null, isActive: false } : prev);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelection({ text, rect, isActive: true });
    });
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceRef.current) cancelAnimationFrame(debounceRef.current);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection({ text: '', rect: null, isActive: false });
  }, []);

  return { ...selection, clearSelection };
}
