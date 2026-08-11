import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare var lucide: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private iconObserver?: MutationObserver;

  constructor(private router: Router) { }

  ngAfterViewInit() {
    this.createIcons();

    // Re-run icon generation on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.scheduleIconRefresh();
    });

    this.observeIconMutations();
  }

  createIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  private scheduleIconRefresh() {
    setTimeout(() => this.createIcons(), 60);
  }

  private observeIconMutations() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    this.iconObserver = new MutationObserver(() => this.scheduleIconRefresh());
    this.iconObserver.observe(document.body, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.iconObserver?.disconnect();
  }
}

