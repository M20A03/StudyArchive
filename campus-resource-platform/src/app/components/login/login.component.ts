import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../core/toast.service';

declare var lucide: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private userService = inject(UserService);
    private toastService = inject(ToastService);

    loginForm: FormGroup;
    isLoading = false;
    isGoogleLoading = false;
    showPassword = false;

    constructor() {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngAfterViewInit(): void {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    async signInWithGoogle() {
        if (this.isGoogleLoading || this.isLoading) return;
        this.isGoogleLoading = true;
        try {
            await this.userService.loginWithGoogle();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
        } catch {
            // Handled in UserService
        } finally {
            this.isGoogleLoading = false;
        }
    }

    async onSubmit() {
        if (this.loginForm.invalid || this.isLoading) {
            return;
        }

        this.isLoading = true;
        const username = this.loginForm.get('username')?.value ?? '';
        const password = this.loginForm.get('password')?.value ?? '';

        try {
            await this.userService.login(username, password);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
        } catch {
            // Error is handled via ToastService in UserService
        } finally {
            this.isLoading = false;
        }
    }

    showLostPasswordHelp(event: Event) {
        event.preventDefault();
        this.toastService.info('Please enter your registered username or email to log in.', 'Password Help');
    }

    openUserManual(event: Event) {
        event.preventDefault();
        window.open('https://github.com', '_blank', 'noopener');
    }

    showCookiesNotice() {
        this.toastService.info('CampusShare uses local session storage for authentication and theme preferences.', 'Privacy & Cookies');
    }
}
