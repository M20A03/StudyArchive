import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { ToastMessage } from './models';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-wrapper" aria-live="polite" aria-atomic="true">
            <div *ngFor="let toast of toastService.toasts$ | async" 
                 class="toast-item" 
                 [ngClass]="'toast-' + toast.type"
                 role="alert">
                <div class="toast-icon">
                    <span *ngIf="toast.type === 'success'">✓</span>
                    <span *ngIf="toast.type === 'error'">✕</span>
                    <span *ngIf="toast.type === 'warning'">⚠</span>
                    <span *ngIf="toast.type === 'info'">ℹ</span>
                </div>
                <div class="toast-content">
                    <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
                    <div class="toast-message">{{ toast.message }}</div>
                </div>
                <button type="button" class="toast-close" (click)="dismiss(toast.id)" aria-label="Close notification">
                    ×
                </button>
            </div>
        </div>
    `,
    styles: [`
        .toast-wrapper {
            position: fixed;
            top: max(16px, env(safe-area-inset-top, 16px));
            right: max(16px, env(safe-area-inset-right, 16px));
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: min(420px, calc(100vw - 32px));
            pointer-events: none;
        }

        .toast-item {
            pointer-events: auto;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #f8fafc;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
            animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            transition: all 0.2s ease;
        }

        .toast-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            flex-shrink: 0;
        }

        .toast-success .toast-icon { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
        .toast-error .toast-icon { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
        .toast-warning .toast-icon { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
        .toast-info .toast-icon { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }

        .toast-content {
            flex: 1;
            min-width: 0;
        }

        .toast-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 2px;
            color: #ffffff;
        }

        .toast-message {
            font-size: 13px;
            line-height: 1.4;
            color: #cbd5e1;
            word-break: break-word;
        }

        .toast-close {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            transition: color 0.15s ease;
        }

        .toast-close:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-12px) scale(0.96);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `]
})
export class ToastContainerComponent {
    constructor(public toastService: ToastService) {}

    dismiss(id: string) {
        this.toastService.remove(id);
    }
}
