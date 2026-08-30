import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

export interface BreakpointState {
    isMobile: boolean;    // < 640px
    isTablet: boolean;    // 640px - 1023px
    isLaptop: boolean;    // 1024px - 1439px
    isDesktop: boolean;   // >= 1440px
    is4K: boolean;        // >= 2560px
    isTouch: boolean;
    screenWidth: number;
}

@Injectable({
    providedIn: 'root'
})
export class BreakpointService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    private readonly stateSubject = new BehaviorSubject<BreakpointState>(this.calculateState());
    readonly state$ = this.stateSubject.asObservable();

    readonly isMobile$ = this.state$.pipe(map((s) => s.isMobile), distinctUntilChanged());
    readonly isTablet$ = this.state$.pipe(map((s) => s.isTablet), distinctUntilChanged());
    readonly isLaptop$ = this.state$.pipe(map((s) => s.isLaptop), distinctUntilChanged());
    readonly isDesktop$ = this.state$.pipe(map((s) => s.isDesktop), distinctUntilChanged());
    readonly isTouch$ = this.state$.pipe(map((s) => s.isTouch), distinctUntilChanged());

    constructor() {
        if (this.isBrowser) {
            fromEvent(window, 'resize')
                .pipe(
                    debounceTime(60),
                    map(() => this.calculateState()),
                    distinctUntilChanged((a, b) => a.screenWidth === b.screenWidth)
                )
                .subscribe((state) => {
                    this.stateSubject.next(state);
                });
        }
    }

    get currentState(): BreakpointState {
        return this.stateSubject.value;
    }

    private calculateState(): BreakpointState {
        if (!this.isBrowser) {
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

        const width = window.innerWidth;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
}
