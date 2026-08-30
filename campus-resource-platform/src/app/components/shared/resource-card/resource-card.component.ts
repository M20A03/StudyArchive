import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../core/models';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="resource-card animate-fade-in glass-panel" (click)="onCardClick($event)">
      <div class="card-header">
        <span class="badge" [class.public]="resource.privacy === 'Public'" [class.private]="resource.privacy === 'Private'">
          {{resource.privacy}}
        </span>
        <div class="rating" aria-label="Rating: {{resource.rating}} out of 5 stars">
          <i data-lucide="star" class="star-icon"></i>
          <span>{{resource.rating}}</span>
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="title">{{resource.title}}</h3>
        <p class="subject-line">
          <span class="subject">{{resource.subject}}</span>
          <span *ngIf="resource.branch" class="divider-dot">•</span>
          <span *ngIf="resource.branch" class="branch">{{resource.branch}}</span>
        </p>
        
        <div class="tags" *ngIf="resource.tags">
          <ng-container *ngIf="isTagsArray(resource.tags)">
            <span *ngFor="let tag of asArray(resource.tags)" class="tag">#{{tag}}</span>
          </ng-container>
          <ng-container *ngIf="!isTagsArray(resource.tags)">
            <span class="tag">#{{resource.tags}}</span>
          </ng-container>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="meta">
          <span title="Total downloads"><i data-lucide="download"></i> {{resource.downloads}}</span>
          <span title="Uploaded date"><i data-lucide="calendar"></i> {{resource.date}}</span>
        </div>
        
        <div class="card-actions">
          <button type="button" 
                  class="btn-icon-secondary" 
                  (click)="onViewDetails($event)"
                  title="View full resource details">
            <i data-lucide="info"></i>
          </button>
          
          <button type="button" 
                  class="btn-icon-primary" 
                  (click)="onDownloadClick($event)"
                  title="Download resource">
            <i data-lucide="download"></i>
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

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          border-color: var(--brand-primary);
        }
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .rating {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--brand-accent);

        .star-icon {
          width: 14px;
          height: 14px;
          fill: var(--brand-accent);
        }
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
      }

      .subject-line {
        font-size: var(--text-xs);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 6px;

        .subject {
          color: var(--brand-secondary);
          font-weight: 600;
        }

        .divider-dot {
          opacity: 0.5;
        }
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;

        .tag {
          padding: 2px 8px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-sm);
          font-size: 11px !important;
          color: var(--brand-secondary);
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

      .meta {
        display: flex;
        gap: var(--space-3);
        font-size: var(--text-xs);
        color: var(--text-muted);

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            width: 14px;
            height: 14px;
          }
        }
      }

      .card-actions {
        display: flex;
        gap: 6px;
      }

      .btn-icon-primary,
      .btn-icon-secondary {
        @include touch-target;
        width: 38px;
        height: 38px;
        border-radius: var(--radius-md);
        @include flex-center;
        transition: all var(--transition-fast);

        i {
          width: 16px;
          height: 16px;
        }
      }

      .btn-icon-primary {
        background: var(--brand-primary);
        color: #ffffff;

        &:hover {
          background: var(--brand-primary-hover);
          transform: scale(1.05);
        }
      }

      .btn-icon-secondary {
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);

        &:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
        }
      }
    }
  `]
})
export class ResourceCardComponent {
  @Input({ required: true }) resource!: Resource;
  @Output() download = new EventEmitter<Resource>();
  @Output() selectResource = new EventEmitter<Resource>();

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

  isTagsArray(tags: unknown): boolean {
    return Array.isArray(tags);
  }

  asArray(tags: unknown): string[] {
    return tags as string[];
  }
}
