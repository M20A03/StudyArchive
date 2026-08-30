import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
    onSearch?: () => void; // Cmd+K or Ctrl+K
    onEscape?: () => void; // Escape
}

/**
 * Universal useKeyboardShortcut hook handling global Cmd+K and Escape keys.
 */
export function useKeyboardShortcut({ onSearch, onEscape }: ShortcutHandlers) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Cmd+K or Ctrl+K
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                if (onSearch) {
                    event.preventDefault();
                    onSearch();
                }
                return;
            }

            // Escape
            if (event.key === 'Escape') {
                if (onEscape) {
                    onEscape();
                }
                return;
            }
        },
        [onSearch, onEscape]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
