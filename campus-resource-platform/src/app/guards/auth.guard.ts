import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from '../services/user.service';

/**
 * Protects private dashboard routes with asynchronous session hydration.
 * Ensures page refreshes and deep links do not prematurely redirect to /login.
 */
export const authGuard: CanActivateFn = async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const userService = inject(UserService);
    const router = inject(Router);

    const isAuthenticated = await userService.waitForAuthInit();

    if (isAuthenticated) {
        return true;
    }

    // Preserve the intended target URL for seamless post-login redirection
    return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
    });
};

/**
 * Redirects already authenticated users away from /login or /signup to /dashboard.
 */
export const guestGuard: CanActivateFn = async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const userService = inject(UserService);
    const router = inject(Router);

    const isAuthenticated = await userService.waitForAuthInit();

    if (isAuthenticated) {
        const returnUrl = route.queryParams['returnUrl'] || '/dashboard';
        return router.createUrlTree([returnUrl]);
    }

    return true;
};
