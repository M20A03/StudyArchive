import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
    signupForm: FormGroup;
    isLoading = false;

    constructor(private fb: FormBuilder, private router: Router, private userService: UserService) {
        this.signupForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            college: ['', [Validators.required]],
            department: ['', [Validators.required, Validators.minLength(2)]],
            semester: ['1st Semester', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validator: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null : { 'mismatch': true };
    }

    async onSubmit() {
        if (this.signupForm.valid) {
            this.isLoading = true;
            try {
                await this.userService.register({
                    fullName: this.signupForm.get('fullName')?.value ?? '',
                    email: this.signupForm.get('email')?.value ?? '',
                    college: this.signupForm.get('college')?.value ?? '',
                    department: this.signupForm.get('department')?.value ?? '',
                    semester: this.signupForm.get('semester')?.value ?? '1st Semester',
                    password: this.signupForm.get('password')?.value ?? ''
                });
                this.isLoading = false;
                this.router.navigate(['/login']);
            } catch (error: any) {
                this.isLoading = false;
                alert(error?.message || 'Signup failed');
            }
        }
    }
}
