import { useState, useEffect } from 'react';

export interface BreakpointState {
    isMobile: boolean;    // < 640px
    isTablet: boolean;    // 640px - 1023px
    isLaptop: boolean;    // 1024px - 1439px
    isDesktop: boolean;   // >= 1440px
    is4K: boolean;        // >= 2560px
    isTouch: boolean;
    screenWidth: number;
}

export function getBreakpointState(width: number): BreakpointState {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    return {
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isLaptop: width >= 1024 && width < 1440,
        isDesktop: width >= 1440,
        is4K: width >= 2560,
        isTouch,
        screenWidth: width
    };
}

/**
 * Universal useBreakpoint utility hook for cross-platform conditional rendering.
 */
export function useBreakpoint(): BreakpointState {
    const [state, setState] = useState<BreakpointState>(() => {
        if (typeof window === 'undefined') {
            return {
                isMobile: false,
                isTablet: false,
                isLaptop: true,
                isDesktop: false,
                is4K: false,
                isTouch: false,
                screenWidth: 1280
            };
        }
        return getBreakpointState(window.innerWidth);
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setState(getBreakpointState(window.innerWidth));
            }, 60);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return state;
}
