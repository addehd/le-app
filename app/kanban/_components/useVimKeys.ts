import { useEffect, useRef } from 'react';

interface VimKeyHandlers {
  // Columns
  onCreateColumn: () => void;
  onDeleteColumn: () => void;
  onDuplicateColumn: () => void;
  onMoveColumnLeft: () => void;
  onMoveColumnRight: () => void;
  
  // Cards
  onCreateCardBelow: () => void;
  onCreateCardAbove: () => void;
  onDeleteCard: () => void;
  onDuplicateCard: () => void;
  onPasteCardBelow: () => void;
  onPasteCardAbove: () => void;
  onMoveCardDown: () => void;
  onMoveCardUp: () => void;
  
  // Navigation
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  onNavigateDown: () => void;
  onNavigateUp: () => void;
  onJumpToFirst: () => void;
  onJumpToLast: () => void;
  onJumpToNext: () => void;
  onJumpToPrev: () => void;
}

export const useVimKeys = (handlers: VimKeyHandlers) => {
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      const prevKey = timeSinceLastKey < 500 ? lastKeyRef.current : null;

      // Two-key combos
      if (prevKey === 'c' && e.key === 'c') {
        e.preventDefault();
        handlers.onCreateColumn();
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'd' && e.key === 'c') {
        e.preventDefault();
        handlers.onDeleteColumn();
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'y' && e.key === 'c') {
        e.preventDefault();
        handlers.onDuplicateColumn();
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'g' && e.key === 'c') {
        e.preventDefault();
        // Focus column (not implementing for now)
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'd' && e.key === 'd') {
        e.preventDefault();
        handlers.onDeleteCard();
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'y' && e.key === 'y') {
        e.preventDefault();
        handlers.onDuplicateCard();
        lastKeyRef.current = null;
        return;
      }

      if (prevKey === 'g' && e.key === 'g') {
        e.preventDefault();
        handlers.onJumpToFirst();
        lastKeyRef.current = null;
        return;
      }

      // Single-key commands
      switch (e.key) {
        case 'o':
          e.preventDefault();
          handlers.onCreateCardBelow();
          break;
        case 'O':
          e.preventDefault();
          handlers.onCreateCardAbove();
          break;
        case 'p':
          e.preventDefault();
          handlers.onPasteCardBelow();
          break;
        case 'P':
          e.preventDefault();
          handlers.onPasteCardAbove();
          break;
        case 'J':
          e.preventDefault();
          handlers.onMoveCardDown();
          break;
        case 'K':
          e.preventDefault();
          handlers.onMoveCardUp();
          break;
        case 'h':
          e.preventDefault();
          handlers.onNavigateLeft();
          break;
        case 'l':
          e.preventDefault();
          handlers.onNavigateRight();
          break;
        case 'j':
          e.preventDefault();
          handlers.onNavigateDown();
          break;
        case 'k':
          e.preventDefault();
          handlers.onNavigateUp();
          break;
        case 'G':
          e.preventDefault();
          handlers.onJumpToLast();
          break;
        case 'w':
          e.preventDefault();
          handlers.onJumpToNext();
          break;
        case 'b':
          e.preventDefault();
          handlers.onJumpToPrev();
          break;
        case '<':
          e.preventDefault();
          handlers.onMoveColumnLeft();
          break;
        case '>':
          e.preventDefault();
          handlers.onMoveColumnRight();
          break;
        case 'c':
        case 'd':
        case 'y':
        case 'g':
          // Store for potential two-key combo
          lastKeyRef.current = e.key;
          lastKeyTimeRef.current = now;
          break;
        default:
          lastKeyRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
