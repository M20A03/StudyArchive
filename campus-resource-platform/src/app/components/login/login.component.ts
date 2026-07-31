import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    isLoading = false;
    errorMessage = '';

    constructor(
        private router: Router,
        private userService: UserService
    ) {}

    async loginWithGoogle() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            await this.userService.loginWithGoogle();
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            this.isLoading = false;
            this.errorMessage = error?.message || 'Google sign in failed. Please try again.';
        }
    }

    continueAsGuest() {
        this.router.navigate(['/dashboard']);
    }
}
