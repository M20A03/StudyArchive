import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(
        private injector: Injector,
        private zone: NgZone
    ) {}

    handleError(error: unknown): void {
        console.error('[GlobalErrorHandler caught error]:', error);

        const toastService = this.injector.get(ToastService);
        const friendlyMessage = this.mapToFriendlyMessage(error);

        this.zone.run(() => {
            toastService.error(friendlyMessage, 'Application Error');
        });
    }

    private mapToFriendlyMessage(error: unknown): string {
        if (!error) return 'An unexpected error occurred.';

        const err = error as Record<string, unknown>;
        const rawMessage = (err['message'] as string) || (err['statusText'] as string) || String(error);
        const code = (err['code'] as string) || '';

        // Firebase Firestore / Auth error mapping
        if (code === 'permission-denied' || rawMessage.includes('permission-denied')) {
            return 'You do not have permission to access or modify this resource.';
        }
        if (code === 'unavailable' || rawMessage.includes('unavailable')) {
            return 'Database connection is temporarily offline. Changes are saved locally.';
        }
        if (code === 'not-found' || rawMessage.includes('not-found')) {
            return 'The requested resource was not found.';
        }
        if (code === 'already-exists' || rawMessage.includes('already-exists')) {
            return 'This item or email already exists.';
        }
        if (code === 'resource-exhausted' || rawMessage.includes('resource-exhausted')) {
            return 'Rate limit exceeded. Please wait a moment before trying again.';
        }
        if (code === 'auth/invalid-credential' || rawMessage.includes('invalid-credential')) {
            return 'Invalid username or password.';
        }
        if (code === 'P2002' || rawMessage.includes('unique constraint')) {
            return 'A record with this identifier already exists.';
        }
        if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
            return 'Network issue detected. Please check your internet connection.';
        }

        return rawMessage.length < 120 ? rawMessage : 'An unexpected error occurred. Please try again.';
    }
}
