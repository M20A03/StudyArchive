import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
    // Allow guest access so users can explore the platform before logging in
    return true;
};
