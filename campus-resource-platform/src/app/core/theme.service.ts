import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ThemeMode } from './models';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private readonly themeStorageKey = 'app_theme_mode';

    private currentModeSubject = new BehaviorSubject<ThemeMode>('system');
    readonly currentMode$ = this.currentModeSubject.asObservable();

    private isDarkSubject = new BehaviorSubject<boolean>(true);
    readonly isDark$ = this.isDarkSubject.asObservable();

    constructor() {
        if (this.isBrowser) {
            const saved = (localStorage.getItem(this.themeStorageKey) as ThemeMode) || 'system';
            this.setTheme(saved, false);

            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.currentModeSubject.value === 'system') {
                    this.applyThemeToDOM(this.resolveIsDark('system'));
                }
            });
        }
    }

    setTheme(mode: ThemeMode, persist: boolean = true) {
        this.currentModeSubject.next(mode);
        if (this.isBrowser && persist) {
            localStorage.setItem(this.themeStorageKey, mode);
        }

        const isDark = this.resolveIsDark(mode);
        this.isDarkSubject.next(isDark);
        this.applyThemeToDOM(isDark);
    }

    toggleTheme() {
        const next: ThemeMode = this.isDarkSubject.value ? 'light' : 'dark';
        this.setTheme(next);
    }

    get currentMode(): ThemeMode {
        return this.currentModeSubject.value;
    }

    get isDark(): boolean {
        return this.isDarkSubject.value;
    }

    private resolveIsDark(mode: ThemeMode): boolean {
        if (mode === 'light') return false;
        if (mode === 'dark') return true;
        if (this.isBrowser && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true;
    }

    private applyThemeToDOM(isDark: boolean) {
        if (!this.isBrowser || typeof document === 'undefined') return;

        const root = document.documentElement;
        const body = document.body;

        if (isDark) {
            root.classList.remove('light-theme');
            root.classList.add('dark-theme');
            root.setAttribute('data-theme', 'dark');
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            root.classList.remove('dark-theme');
            root.classList.add('light-theme');
            root.setAttribute('data-theme', 'light');
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
    }
}
