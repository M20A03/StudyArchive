import { Component, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastContainerComponent } from './core/toast-container.component';
import { ThemeService } from './core/theme.service';
import { KeyboardShortcutService } from './core/keyboard-shortcut.service';

declare var lucide: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <app-toast-container></app-toast-container>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private keyboardShortcutService = inject(KeyboardShortcutService);

  private iconObserver?: MutationObserver;

  constructor() {
    if (this.isBrowser) {
      // Global search shortcut handler
      this.keyboardShortcutService.onSearchShortcut$.subscribe(() => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          this.router.navigate(['/dashboard/search']);
        }
      });
    }
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.createIcons();

    // Re-run icon generation on route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.scheduleIconRefresh();
    });

    this.observeIconMutations();
  }

  createIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  private scheduleIconRefresh() {
    setTimeout(() => this.createIcons(), 50);
  }

  private observeIconMutations() {
    if (!this.isBrowser || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    this.iconObserver = new MutationObserver(() => this.scheduleIconRefresh());
    this.iconObserver.observe(document.body, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.iconObserver?.disconnect();
  }
}
