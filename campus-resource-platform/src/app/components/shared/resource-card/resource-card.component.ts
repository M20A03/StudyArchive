import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../core/models';
import { BookmarkService } from '../../../core/bookmark.service';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="resource-card glass-panel" (click)="onCardClick($event)">
      <!-- Top Bar: Category & Bookmark Button -->
      <div class="card-header">
        <div class="badge-cluster">
          <span class="file-badge" [ngClass]="getFileTypeClass()">
            {{ getFileTypeLabel() }}
          </span>
          <span class="category-badge" *ngIf="resource.category">
            {{ resource.category }}
          </span>
          <span class="privacy-badge" [class.private]="resource.privacy === 'Private'">
            {{ resource.privacy }}
          </span>
        </div>

        <button type="button" 
                class="btn-bookmark" 
                [class.is-bookmarked]="isBookmarked()"
                (click)="onBookmarkClick($event)"
                [attr.aria-label]="isBookmarked() ? 'Remove from bookmarks' : 'Add to bookmarks'"
                [title]="isBookmarked() ? 'Saved in bookmarks' : 'Save bookmark'">
          <svg class="icon-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
        </button>
      </div>
      
      <!-- Body: Title & Academic Details -->
      <div class="card-body">
        <h3 class="title" [title]="resource.title">{{ resource.title }}</h3>
        
        <p class="subject-line">
          <span class="subject">{{ resource.subject }}</span>
          <span *ngIf="resource.branch" class="divider-dot">•</span>
          <span *ngIf="resource.branch" class="branch">{{ resource.branch }}</span>
          <span *ngIf="resource.semester" class="divider-dot">•</span>
          <span *ngIf="resource.semester" class="sem">{{ resource.semester }}</span>
        </p>

        <p class="description-preview" *ngIf="resource.description">
          {{ resource.description }}
        </p>
        
        <div class="tags" *ngIf="resource.tags">
          <ng-container *ngIf="isTagsArray(resource.tags)">
            <span *ngFor="let tag of asArray(resource.tags)" class="tag">#{{ tag }}</span>
          </ng-container>
          <ng-container *ngIf="!isTagsArray(resource.tags)">
            <span class="tag">#{{ resource.tags }}</span>
          </ng-container>
        </div>
      </div>
      
      <!-- Footer: Metadata & Actions -->
      <div class="card-footer">
        <div class="meta-stats">
          <div class="rating-pill" aria-label="Rating: {{ resource.rating }} out of 5 stars">
            <svg class="icon-star" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>{{ resource.rating ? resource.rating.toFixed(1) : '5.0' }}</span>
          </div>

          <div class="downloads-pill" title="Total downloads">
            <svg class="icon-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span>{{ resource.downloads || 0 }}</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button type="button" 
                  class="btn-action-preview" 
                  (click)="onViewDetails($event)"
                  title="Interactive Document Preview & Details">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Preview</span>
          </button>
          
          <button type="button" 
                  class="btn-action-download" 
                  (click)="onDownloadClick($event)"
                  title="Download resource directly">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'variables' as *;

    .resource-card {
      padding: var(--space-5);
      border-radius: var(--radius-lg);
      @include hover-lift;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      height: 100%;
      cursor: pointer;
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      backdrop-filter: blur(16px);
      transition: all var(--transition-smooth);

      &:hover {
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(99, 102, 241, 0.15);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .badge-cluster {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .file-badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: var(--radius-sm);

      &.badge-pdf {
        background: rgba(239, 68, 68, 0.16);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      &.badge-docx {
        background: rgba(59, 130, 246, 0.16);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      &.badge-pptx {
        background: rgba(245, 158, 11, 0.16);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      &.badge-code {
        background: rgba(16, 185, 129, 0.16);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      &.badge-default {
        background: rgba(99, 102, 241, 0.16);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }
    }

    .category-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      background: rgba(20, 184, 166, 0.14);
      color: #2dd4bf;
      border: 1px solid rgba(20, 184, 166, 0.25);
    }

    .privacy-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 6px;
      border-radius: var(--radius-xs);
      background: rgba(148, 163, 184, 0.12);
      color: var(--text-muted);

      &.private {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
      }
    }

    .btn-bookmark {
      @include touch-target;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      @include flex-center;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex-shrink: 0;

      .icon-bookmark {
        width: 17px;
        height: 17px;
        transition: transform var(--transition-fast);
      }

      &:hover {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.3);
        transform: scale(1.08);
      }

      &.is-bookmarked {
        background: rgba(245, 158, 11, 0.18);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.45);

        .icon-bookmark {
          fill: #f59e0b;
        }
      }

      &:active {
        transform: scale(0.92);
      }
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .title {
        font-size: var(--text-md);
        font-weight: 700;
        color: var(--text-primary);
        line-height: var(--leading-snug);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .subject-line {
        font-size: var(--text-xs);
        color: var(--text-muted);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;

        .subject {
          color: var(--brand-secondary);
          font-weight: 600;
        }

        .branch {
          color: var(--text-secondary);
        }

        .sem {
          color: var(--text-muted);
        }

        .divider-dot {
          opacity: 0.4;
        }
      }

      .description-preview {
        font-size: var(--text-xs);
        color: var(--text-secondary);
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        opacity: 0.85;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;

        .tag {
          padding: 2px 8px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.22);
          border-radius: var(--radius-sm);
          font-size: 11px !important;
          color: #a5b4fc;
          font-weight: 500;
        }
      }
    }

    .card-footer {
      margin-top: auto;
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .meta-stats {
      display: flex;
      align-items: center;
      gap: var(--space-3);

      .rating-pill,
      .downloads-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-secondary);

        svg {
          width: 14px;
          height: 14px;
        }
      }

      .rating-pill {
        color: #f59e0b;
        .icon-star {
          fill: #f59e0b;
        }
      }

      .downloads-pill {
        color: var(--text-muted);
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-action-preview {
      @include touch-target;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      height: 38px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);

      .btn-icon {
        width: 15px;
        height: 15px;
        color: var(--brand-secondary);
      }

      &:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.4);
        color: #ffffff;
        transform: translateY(-1px);
      }

      &:active {
        transform: scale(0.96);
      }
    }

    .btn-action-download {
      @include touch-target;
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: var(--brand-primary);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      @include flex-center;
      cursor: pointer;
      transition: all var(--transition-fast);

      .btn-icon {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: var(--brand-primary-hover);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
        transform: scale(1.06);
      }

      &:active {
        transform: scale(0.94);
      }
    }
  `]
})
export class ResourceCardComponent {
  private bookmarkService = inject(BookmarkService);

  @Input({ required: true }) resource!: Resource;
  @Output() download = new EventEmitter<Resource>();
  @Output() selectResource = new EventEmitter<Resource>();
  @Output() bookmarkToggle = new EventEmitter<{ resource: Resource; isBookmarked: boolean }>();

  isBookmarked(): boolean {
    return this.bookmarkService.isBookmarked(this.resource.id);
  }

  onBookmarkClick(event: MouseEvent) {
    event.stopPropagation();
    const state = this.bookmarkService.toggleBookmark(this.resource);
    this.bookmarkToggle.emit({ resource: this.resource, isBookmarked: state });
  }

  onCardClick(event: MouseEvent) {
    this.selectResource.emit(this.resource);
  }

  onViewDetails(event: MouseEvent) {
    event.stopPropagation();
    this.selectResource.emit(this.resource);
  }

  onDownloadClick(event: MouseEvent) {
    event.stopPropagation();
    this.download.emit(this.resource);
  }

  getFileTypeLabel(): string {
    if (this.resource.fileType) return this.resource.fileType.toUpperCase();
    const title = this.resource.title.toLowerCase();
    if (title.includes('notes') || title.includes('guide')) return 'PDF';
    if (title.includes('exam') || title.includes('paper')) return 'DOCX';
    if (title.includes('slides') || title.includes('presentation')) return 'PPTX';
    if (title.includes('code') || title.includes('algorithm')) return 'CODE';
    return 'PDF';
  }

  getFileTypeClass(): string {
    const label = this.getFileTypeLabel().toLowerCase();
    if (label.includes('pdf')) return 'badge-pdf';
    if (label.includes('doc')) return 'badge-docx';
    if (label.includes('ppt')) return 'badge-pptx';
    if (label.includes('code')) return 'badge-code';
    return 'badge-default';
  }

  isTagsArray(tags: unknown): boolean {
    return Array.isArray(tags);
  }

  asArray(tags: unknown): string[] {
    return tags as string[];
  }
}
