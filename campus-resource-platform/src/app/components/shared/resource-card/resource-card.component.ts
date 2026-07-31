import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resource-card animate-fade-in glass-panel">

      <div class="card-header">
        <span class="badge" [class.public]="resource?.privacy === 'Public'" [class.private]="resource?.privacy === 'Private'">
          {{resource?.privacy}}
        </span>
        <div class="rating">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="star-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {{resource?.rating}}
        </div>
      </div>
      
      <div class="card-body">
        <h4 class="title">{{resource?.title}}</h4>
        <p class="subject">{{resource?.subject}}</p>
        <div class="tags" *ngIf="resource?.tags">
          <span *ngFor="let tag of (getTagsArray(resource?.tags))" class="tag">{{tag}}</span>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="meta">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            {{resource?.downloads || 0}}
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            {{resource?.date}}
          </span>
        </div>
        <button class="btn-icon-primary" (click)="onDownloadClick()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    .resource-card {
      padding: 20px;
      border-radius: $radius-lg;
      @include hover-lift;
      display: flex;
      flex-direction: column;
      gap: 14px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: $accent-amber;
          svg { width: 14px; height: 14px; fill: $accent-amber; }
        }
      }
      
      .title { font-size: 16px; font-weight: 700; color: $text-dark-primary; line-height: 1.4; }
      .subject { font-size: 13px; color: $text-dark-secondary; margin-top: -6px; }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        .tag {
          padding: 3px 10px;
          background: rgba(148, 163, 184, 0.08);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: $text-dark-secondary;
        }
      }
      
      .card-footer {
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid $dark-border;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: $text-dark-muted;
          span { display: flex; align-items: center; gap: 4px; svg { width: 13px; height: 13px; } }
        }
      }
      
      .btn-icon-primary {
        width: 34px;
        height: 34px;
        border-radius: $radius-sm;
        border: none;
        background: $accent-indigo;
        color: white;
        @include flex-center;
        cursor: pointer;
        @include transition-fast;
        &:hover { background: $accent-indigo-hover; transform: scale(1.05); }
      }
    }

    body.light-theme {
      .resource-card {
        .title { color: $text-light-primary; }
        .subject { color: $text-light-secondary; }
        .tags .tag { background: rgba(0,0,0,0.04); color: $text-light-secondary; }
        .card-footer { border-top-color: $light-border; .meta { color: $text-light-muted; } }
      }
    }
  `]
})
export class ResourceCardComponent {
  @Input() resource: any;
  @Output() download = new EventEmitter<string>();

  getTagsArray(tags: any): string[] {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim());
    return [];
  }

  onDownloadClick() {
    if (this.resource?.id) {
      this.download.emit(this.resource.id);
    }
  }
}


