import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private userService: UserService
    ) {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnInit(): void {
        // Initialize icons if needed (though we use tag names)
    }

    async onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading = true;
            const username = this.loginForm.get('username')?.value ?? '';
            const password = this.loginForm.get('password')?.value ?? '';
            try {
                await this.userService.login(username, password);
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            } catch (error: any) {
                this.isLoading = false;
                alert(error?.message || 'Login failed');
            }
        }
    }

    showLostPasswordHelp(event: Event) {
        event.preventDefault();
        alert('Use your registered email or username to login. Password reset integration can be connected with Firebase Auth next.');
    }

    openUserManual(event: Event) {
        event.preventDefault();
        window.open('https://firebase.google.com/docs', '_blank', 'noopener');
    }

    showCookiesNotice() {
        alert('We use essential cookies for login sessions and preferences such as theme selection.');
    }
}
