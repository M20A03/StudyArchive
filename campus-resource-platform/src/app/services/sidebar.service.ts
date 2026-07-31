import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private mobileOpenSubject = new BehaviorSubject<boolean>(false);
    mobileOpen$ = this.mobileOpenSubject.asObservable();

    toggleMobile() {
        this.mobileOpenSubject.next(!this.mobileOpenSubject.value);
    }

    openMobile() {
        this.mobileOpenSubject.next(true);
    }

    closeMobile() {
        this.mobileOpenSubject.next(false);
    }

    isMobileOpen(): boolean {
        return this.mobileOpenSubject.value;
    }
}
