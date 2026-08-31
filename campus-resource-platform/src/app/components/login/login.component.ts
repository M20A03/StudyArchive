import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';

declare var lucide: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private userService = inject(UserService);

    isGoogleLoading = false;

    ngAfterViewInit(): void {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }

    async signInWithGoogle() {
        if (this.isGoogleLoading) return;
        this.isGoogleLoading = true;
        try {
            await this.userService.loginWithGoogle();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
        } catch {
            // Error handled via Toast in UserService
        } finally {
            this.isGoogleLoading = false;
        }
    }
}
