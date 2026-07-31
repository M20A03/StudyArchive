import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
    isLoading = false;
    errorMessage = '';

    constructor(private router: Router, private userService: UserService) {}

    async signupWithGoogle() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            await this.userService.loginWithGoogle();
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
        } catch (error: any) {
            this.isLoading = false;
            this.errorMessage = error?.message || 'Google verification failed.';
        }
    }

    continueAsGuest() {
        this.router.navigate(['/dashboard']);
    }
}
