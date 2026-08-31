import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from '@angular/fire/auth';
import { UserProfile } from '../core/models';
import { ToastService } from '../core/toast.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private auth = inject(Auth, { optional: true });
    private platformId = inject(PLATFORM_ID);
    private toastService = inject(ToastService);
    private isBrowser = isPlatformBrowser(this.platformId);
    private usersCollection = collection(this.firestore, 'users');
    private currentUserId: string | null = null;
    private readonly uidStorageKey = 'uid';
    private readonly profileStorageKey = 'user_profile_cache';

    private isInitializedSubject = new BehaviorSubject<boolean>(false);
    readonly isInitialized$ = this.isInitializedSubject.asObservable();

    private userProfile = new BehaviorSubject<UserProfile>({
        name: 'Guest User',
        university: 'Your University',
        department: 'Your Department',
        semester: '1st Semester'
    });
    private authState = new BehaviorSubject<boolean>(false);

    userProfile$ = this.userProfile.asObservable();
    authState$ = this.authState.asObservable();

    private isAuthOperationInProgress = false;

    constructor() {
        if (this.isBrowser) {
            this.restoreSession();
        } else {
            this.isInitializedSubject.next(true);
        }
    }

    /**
     * Blocks route guards until session hydration completes to prevent
     * premature redirects to /login on page refresh.
     */
    async waitForAuthInit(): Promise<boolean> {
        if (this.isInitializedSubject.value) {
            return this.authState.value;
        }
        await firstValueFrom(this.isInitialized$.pipe(filter(init => init === true)));
        return this.authState.value;
    }

    private async restoreSession() {
        const uid = localStorage.getItem(this.uidStorageKey);
        const cachedProfile = localStorage.getItem(this.profileStorageKey);

        if (cachedProfile) {
            try {
                const parsed = JSON.parse(cachedProfile) as UserProfile;
                this.userProfile.next(parsed);
            } catch {
                // Ignore parse errors
            }
        }

        if (!uid) {
            this.isInitializedSubject.next(true);
            return;
        }

        try {
            this.currentUserId = uid;
            const snap = await getDoc(doc(this.firestore, 'users', uid));
            if (snap.exists()) {
                const profile = this.fromFirestore(snap.data() as Record<string, unknown>, uid);
                this.userProfile.next(profile);
                this.authState.next(true);
                localStorage.setItem(this.profileStorageKey, JSON.stringify(profile));
            } else if (cachedProfile) {
                // If snap not found but cached profile exists, retain session for offline resilience
                this.authState.next(true);
            } else {
                localStorage.removeItem(this.uidStorageKey);
                localStorage.removeItem(this.profileStorageKey);
                this.currentUserId = null;
                this.authState.next(false);
            }
        } catch (error) {
            console.warn('[UserService] Firestore session restore offline/throttled. Using cached state.');
            if (cachedProfile) {
                this.authState.next(true);
            } else {
                this.authState.next(false);
            }
        } finally {
            this.isInitializedSubject.next(true);
        }
    }

    async register(payload: { fullName: string; email: string; college: string; department: string; semester: string; password: string }): Promise<void> {
        if (this.isAuthOperationInProgress) {
            throw new Error('Registration in progress. Please wait.');
        }

        this.isAuthOperationInProgress = true;
        try {
            const username = payload.email.split('@')[0].toLowerCase().trim();
            const emailLower = payload.email.toLowerCase().trim();

            const existingByEmail = await getDocs(query(this.usersCollection, where('email', '==', emailLower)));
            if (!existingByEmail.empty) {
                throw new Error('This email is already registered.');
            }

            const now = new Date().toISOString();
            const created = await addDoc(this.usersCollection, {
                name: payload.fullName.trim(),
                email: emailLower,
                password: payload.password,
                username,
                university: payload.college.trim(),
                department: payload.department.trim(),
                semester: payload.semester.trim(),
                createdAt: now,
                updatedAt: now
            });

            this.currentUserId = created.id;
            const newProfile: UserProfile = {
                id: created.id,
                name: payload.fullName.trim(),
                email: emailLower,
                username,
                university: payload.college.trim(),
                department: payload.department.trim(),
                semester: payload.semester.trim(),
                createdAt: now
            };

            if (this.isBrowser) {
                localStorage.setItem(this.uidStorageKey, created.id);
                localStorage.setItem(this.profileStorageKey, JSON.stringify(newProfile));
            }

            this.authState.next(true);
            this.userProfile.next(newProfile);
            this.toastService.success('Account created successfully! Welcome to CampusShare.', 'Welcome');
        } catch (err: unknown) {
            const message = (err as Error)?.message || 'Registration failed.';
            this.toastService.error(message, 'Sign Up Error');
            throw err;
        } finally {
            this.isAuthOperationInProgress = false;
        }
    }

    async login(identifier: string, password: string): Promise<void> {
        if (this.isAuthOperationInProgress) {
            throw new Error('Login in progress. Please wait.');
        }

        this.isAuthOperationInProgress = true;
        try {
            const normalized = identifier.trim().toLowerCase();
            const emailQuery = await getDocs(query(this.usersCollection, where('email', '==', normalized)));
            let match = emailQuery.docs[0];

            if (!match) {
                const usernameQuery = await getDocs(query(this.usersCollection, where('username', '==', normalized)));
                match = usernameQuery.docs[0];
            }

            if (!match) {
                throw new Error('User not found. Please check your username or email.');
            }

            const data = match.data() as Record<string, unknown>;
            if ((data['password'] as string) !== password) {
                throw new Error('Invalid password. Please try again.');
            }

            this.currentUserId = match.id;
            const profile = this.fromFirestore(data, match.id);

            if (this.isBrowser) {
                localStorage.setItem(this.uidStorageKey, match.id);
                localStorage.setItem(this.profileStorageKey, JSON.stringify(profile));
            }

            this.authState.next(true);
            this.userProfile.next(profile);
            this.toastService.success(`Welcome back, ${profile.name}!`, 'Logged In');
        } catch (err: unknown) {
            const message = (err as Error)?.message || 'Login failed.';
            this.toastService.error(message, 'Authentication Error');
            throw err;
        } finally {
            this.isAuthOperationInProgress = false;
        }
    }

    async loginWithGoogle(): Promise<void> {
        if (this.isAuthOperationInProgress) {
            throw new Error('Authentication in progress. Please wait.');
        }

        this.isAuthOperationInProgress = true;
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth service is not ready. Please try again.');
            }

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(this.auth, provider);
            const user = result.user;
            const uid = user.uid;
            const email = user.email?.toLowerCase().trim() || '';
            const name = user.displayName || email.split('@')[0] || 'Campus Student';
            const username = email ? email.split('@')[0] : `user_${uid.substring(0, 6)}`;

            const userDocRef = doc(this.firestore, 'users', uid);
            let profile: UserProfile;

            try {
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    profile = this.fromFirestore(userDocSnap.data() as Record<string, unknown>, uid);
                } else {
                    const now = new Date().toISOString();
                    const newUserData = {
                        name,
                        email,
                        username,
                        university: 'Campus Community',
                        department: 'Academic Studies',
                        semester: '1st Semester',
                        createdAt: now,
                        updatedAt: now
                    };
                    await setDoc(userDocRef, newUserData);
                    profile = {
                        id: uid,
                        ...newUserData
                    };
                }
            } catch {
                // If firestore read fails, fallback to user profile
                profile = {
                    id: uid,
                    name,
                    email,
                    username,
                    university: 'Campus Community',
                    department: 'Academic Studies',
                    semester: '1st Semester'
                };
            }

            this.currentUserId = uid;
            if (this.isBrowser) {
                localStorage.setItem(this.uidStorageKey, uid);
                localStorage.setItem(this.profileStorageKey, JSON.stringify(profile));
            }

            this.authState.next(true);
            this.userProfile.next(profile);
            this.toastService.success(`Welcome, ${profile.name}!`, 'Signed In with Google');
        } catch (err: any) {
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                return; // User intentionally closed the popup
            }
            const message = err?.message || 'Google Sign-In failed.';
            this.toastService.error(message, 'Google Sign-In Error');
            throw err;
        } finally {
            this.isAuthOperationInProgress = false;
        }
    }

    logout() {
        this.currentUserId = null;
        if (this.auth) {
            firebaseSignOut(this.auth).catch(() => {});
        }
        if (this.isBrowser) {
            localStorage.removeItem(this.uidStorageKey);
            localStorage.removeItem(this.profileStorageKey);
        }
        this.authState.next(false);
        this.userProfile.next({
            name: 'Guest User',
            university: 'Your University',
            department: 'Your Department',
            semester: '1st Semester'
        });
        this.toastService.info('You have been logged out.', 'Goodbye');
    }

    async updateProfile(profileUpdates: Partial<UserProfile>) {
        const current = this.userProfile.value;
        const updated = { ...current, ...profileUpdates, updatedAt: new Date().toISOString() };
        this.userProfile.next(updated);

        if (this.isBrowser) {
            localStorage.setItem(this.profileStorageKey, JSON.stringify(updated));
        }

        if (this.currentUserId) {
            try {
                await updateDoc(doc(this.firestore, 'users', this.currentUserId), {
                    name: updated.name,
                    university: updated.university,
                    department: updated.department,
                    semester: updated.semester,
                    updatedAt: updated.updatedAt
                });
                this.toastService.success('Profile updated successfully!', 'Saved');
            } catch (err) {
                console.warn('[UserService] Remote profile update failed, cached locally.', err);
                this.toastService.warning('Profile updated locally (offline mode).', 'Offline Update');
            }
        }
    }

    getProfile(): UserProfile {
        return this.userProfile.value;
    }

    isAuthenticated(): boolean {
        return !!this.currentUserId || this.authState.value;
    }

    getCurrentUserId(): string | null {
        return this.currentUserId;
    }

    private fromFirestore(data: Record<string, unknown>, id: string): UserProfile {
        return {
            id,
            name: (data['name'] as string) || 'Guest User',
            email: (data['email'] as string) || '',
            username: (data['username'] as string) || '',
            university: (data['university'] as string) || 'Your University',
            department: (data['department'] as string) || 'Your Department',
            semester: (data['semester'] as string) || '1st Semester',
            createdAt: (data['createdAt'] as string) || undefined,
            updatedAt: (data['updatedAt'] as string) || undefined
        };
    }
}
