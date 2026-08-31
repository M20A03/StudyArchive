import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

declare var lucide: any;

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent implements AfterViewInit {
    private router = inject(Router);
    private userService = inject(UserService);

    isGoogleLoading = false;

    ngAfterViewInit(): void {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }

    async signUpWithGoogle() {
        if (this.isGoogleLoading) return;
        this.isGoogleLoading = true;
        try {
            await this.userService.loginWithGoogle();
            this.router.navigate(['/dashboard']);
        } catch {
            // Error handled via Toast in UserService
        } finally {
            this.isGoogleLoading = false;
        }
    }
}
