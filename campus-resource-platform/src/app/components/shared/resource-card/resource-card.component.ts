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
          <i data-lucide="star"></i>
          {{resource?.rating}}
        </div>
      </div>
      
      <div class="card-body">
        <h4 class="title">{{resource?.title}}</h4>
        <p class="subject">{{resource?.subject}}</p>
        <div class="tags">
          <span *ngFor="let tag of resource?.tags" class="tag">{{tag}}</span>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="meta">
          <span><i data-lucide="download"></i> {{resource?.downloads}}</span>
          <span><i data-lucide="calendar"></i> {{resource?.date}}</span>
        </div>
        <button class="btn-icon-primary" (click)="onDownloadClick()"><i data-lucide="download"></i></button>
      </div>
    </div>
  `,
  styles: [`
    @use 'variables' as *;
    .resource-card {
      padding: 20px;
      border-radius: $border-radius-lg;
      @include hover-lift;
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
          color: $accent-yellow;
          i { width: 14px; height: 14px; fill: $accent-yellow; }
        }
      }
      
      .title { font-size: 16px; font-weight: 700; color: $text-main; line-height: 1.4; }
      .subject { font-size: 13px; color: $text-secondary; margin-top: -12px; }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        .tag {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          font-size: 11px;
          color: $text-secondary;
        }
      }
      
      .card-footer {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid rgba(185, 203, 243, 0.16);
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: $text-muted;
          span { display: flex; align-items: center; gap: 4px; i { width: 14px; height: 14px; } }
        }
      }
      
      .btn-icon-primary {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: none;
        background: $primary-blue;
        color: white;
        @include flex-center;
        cursor: pointer;
        @include smooth-transition;
        &:hover { background: $accent-blue; transform: scale(1.05); }
      }
    }
  `]
})
export class ResourceCardComponent {
  @Input() resource: any;
  @Output() download = new EventEmitter<string>();

  onDownloadClick() {
    if (this.resource?.id) {
      this.download.emit(this.resource.id);
    }
  }
}


