import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../core/toast.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private userService = inject(UserService);
    private toastService = inject(ToastService);

    signupForm: FormGroup;
    isLoading = false;

    constructor() {
        this.signupForm = this.fb.group(
            {
                fullName: ['', [Validators.required, Validators.minLength(3)]],
                email: ['', [Validators.required, Validators.email]],
                college: ['', [Validators.required, Validators.minLength(2)]],
                department: ['', [Validators.required, Validators.minLength(2)]],
                semester: ['1st Semester', [Validators.required]],
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', [Validators.required]]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    passwordMatchValidator(control: AbstractControl) {
        const password = control.get('password')?.value;
        const confirm = control.get('confirmPassword')?.value;
        return password === confirm ? null : { mismatch: true };
    }

    async onSubmit() {
        if (this.signupForm.invalid || this.isLoading) {
            return;
        }

        this.isLoading = true;
        try {
            await this.userService.register({
                fullName: this.signupForm.get('fullName')?.value.trim() ?? '',
                email: this.signupForm.get('email')?.value.trim() ?? '',
                college: this.signupForm.get('college')?.value.trim() ?? '',
                department: this.signupForm.get('department')?.value.trim() ?? '',
                semester: this.signupForm.get('semester')?.value ?? '1st Semester',
                password: this.signupForm.get('password')?.value ?? ''
            });

            this.router.navigate(['/dashboard']);
        } catch {
            // Error toast displayed by UserService
        } finally {
            this.isLoading = false;
        }
    }
}
