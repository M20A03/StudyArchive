import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMessage, ToastType } from './models';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
    toasts$ = this.toastsSubject.asObservable();

    show(message: string, type: ToastType = 'info', title?: string, durationMs: number = 4000) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newToast: ToastMessage = { id, message, type, title, durationMs };

        this.toastsSubject.next([...this.toastsSubject.value, newToast]);

        if (durationMs > 0) {
            setTimeout(() => {
                this.remove(id);
            }, durationMs);
        }
    }

    success(message: string, title: string = 'Success') {
        this.show(message, 'success', title);
    }

    error(message: string, title: string = 'Error', durationMs: number = 6000) {
        this.show(message, 'error', title, durationMs);
    }

    warning(message: string, title: string = 'Warning') {
        this.show(message, 'warning', title);
    }

    info(message: string, title: string = 'Information') {
        this.show(message, 'info', title);
    }

    remove(id: string) {
        this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
    }

    clear() {
        this.toastsSubject.next([]);
    }
}
