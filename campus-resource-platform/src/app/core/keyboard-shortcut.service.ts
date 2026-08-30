import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class KeyboardShortcutService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    private searchShortcutTriggered = new Subject<void>();
    private escapeShortcutTriggered = new Subject<void>();

    readonly onSearchShortcut$ = this.searchShortcutTriggered.asObservable();
    readonly onEscapeShortcut$ = this.escapeShortcutTriggered.asObservable();

    constructor() {
        if (this.isBrowser) {
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    private handleKeyDown(event: KeyboardEvent) {
        // Cmd+K or Ctrl+K (Global Search)
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            this.searchShortcutTriggered.next();
            return;
        }

        // Escape (Global Modal/Dropdown/Drawer Close)
        if (event.key === 'Escape') {
            this.escapeShortcutTriggered.next();
            return;
        }
    }
}
