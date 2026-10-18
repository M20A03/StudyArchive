import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mobile-bottom-nav glass-panel" aria-label="Mobile Navigation">
      <div class="nav-container">
        <!-- Home / Overview -->
        <a routerLink="/dashboard" 
           routerLinkActive="active" 
           [routerLinkActiveOptions]="{ exact: true }"
           class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="nav-label">Overview</span>
        </a>

        <!-- Search -->
        <a routerLink="/dashboard/search" 
           routerLinkActive="active" 
           class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="nav-label">Search</span>
        </a>

        <!-- Center Upload Action Button -->
        <a routerLink="/dashboard/upload" 
           routerLinkActive="active" 
           class="nav-item nav-item-upload"
           aria-label="Upload Study Material">
          <div class="upload-fab">
            <svg class="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span class="nav-label">Upload</span>
        </a>

        <!-- My Resources / Library -->
        <a routerLink="/dashboard/my-resources" 
           routerLinkActive="active" 
           class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <polyline points="10 2 10 10 13 7 16 10 16 2"/>
          </svg>
          <span class="nav-label">Library</span>
        </a>

        <!-- Profile or Auth -->
        <a [routerLink]="isAuthenticated ? '/dashboard' : '/login'" 
           class="nav-item"
           [title]="isAuthenticated ? 'Campus Profile' : 'Sign In'">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="nav-label">{{ isAuthenticated ? 'Profile' : 'Sign In' }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'variables' as *;

    .mobile-bottom-nav {
      display: none;

      @media (max-width: 767px) {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: rgba(11, 15, 25, 0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid var(--border-subtle);
        padding-top: 6px;
        padding-bottom: max(8px, env(safe-area-inset-bottom));
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
      }
    }

    .nav-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      max-width: 480px;
      margin: 0 auto;
      padding: 0 8px;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      text-decoration: none;
      color: var(--text-muted);
      padding: 6px 10px;
      min-width: 58px;
      min-height: 44px;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      position: relative;
      -webkit-tap-highlight-color: transparent;

      .nav-icon {
        width: 20px;
        height: 20px;
        transition: transform var(--transition-fast);
      }

      .nav-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      &:active {
        transform: scale(0.92);
      }

      &.active {
        color: var(--brand-primary);

        .nav-icon {
          transform: translateY(-1px);
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          width: 16px;
          height: 2px;
          background: var(--brand-primary);
          border-radius: var(--radius-full);
        }
      }

      &.nav-item-upload {
        .upload-fab {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--brand-gradient);
          color: #ffffff;
          @include flex-center;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          margin-top: -8px;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);

          .fab-icon {
            width: 18px;
            height: 18px;
          }
        }

        &:active .upload-fab {
          transform: scale(0.9);
        }

        &.active .upload-fab {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
        }
      }
    }
  `]
})
export class BottomNavComponent {
  private userService = inject(UserService);

  get isAuthenticated(): boolean {
    return this.userService.isAuthenticated();
  }
}
