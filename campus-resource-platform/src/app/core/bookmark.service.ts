import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Resource } from './models';
import { ToastService } from './toast.service';

const STORAGE_KEY_IDS = 'campus_bookmarks_ids';
const STORAGE_KEY_ITEMS = 'campus_bookmarks_items';

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private platformId = inject(PLATFORM_ID);
  private toastService = inject(ToastService);
  private isBrowser = isPlatformBrowser(this.platformId);

  private bookmarkedIdsSubject = new BehaviorSubject<string[]>([]);
  public bookmarkedIds$ = this.bookmarkedIdsSubject.asObservable();

  private bookmarkedResourcesSubject = new BehaviorSubject<Resource[]>([]);
  public bookmarkedResources$ = this.bookmarkedResourcesSubject.asObservable();

  constructor() {
    if (this.isBrowser) {
      this.hydrateFromStorage();
    }
  }

  isBookmarked(resourceId: string): boolean {
    return this.bookmarkedIdsSubject.value.includes(resourceId);
  }

  toggleBookmark(resource: Resource): boolean {
    if (!this.isBrowser) return false;

    const currentIds = [...this.bookmarkedIdsSubject.value];
    const currentItems = [...this.bookmarkedResourcesSubject.value];
    const index = currentIds.indexOf(resource.id);

    let isSaved = false;

    if (index > -1) {
      // Remove
      currentIds.splice(index, 1);
      const itemIndex = currentItems.findIndex(i => i.id === resource.id);
      if (itemIndex > -1) {
        currentItems.splice(itemIndex, 1);
      }
      this.toastService.info(`"${resource.title}" removed from bookmarks.`, 'Bookmark Removed');
      isSaved = false;
    } else {
      // Add
      currentIds.unshift(resource.id);
      currentItems.unshift({ ...resource, isBookmarked: true });
      this.toastService.success(`"${resource.title}" saved to your bookmarks.`, 'Bookmarked!');
      isSaved = true;
    }

    this.bookmarkedIdsSubject.next(currentIds);
    this.bookmarkedResourcesSubject.next(currentItems);
    this.persistToStorage(currentIds, currentItems);

    return isSaved;
  }

  removeBookmark(resourceId: string): void {
    if (!this.isBrowser) return;

    const currentIds = this.bookmarkedIdsSubject.value.filter(id => id !== resourceId);
    const currentItems = this.bookmarkedResourcesSubject.value.filter(item => item.id !== resourceId);

    this.bookmarkedIdsSubject.next(currentIds);
    this.bookmarkedResourcesSubject.next(currentItems);
    this.persistToStorage(currentIds, currentItems);
  }

  getBookmarkedIds(): string[] {
    return this.bookmarkedIdsSubject.value;
  }

  getBookmarkedResources(): Resource[] {
    return this.bookmarkedResourcesSubject.value;
  }

  private hydrateFromStorage(): void {
    try {
      const storedIds = localStorage.getItem(STORAGE_KEY_IDS);
      const storedItems = localStorage.getItem(STORAGE_KEY_ITEMS);

      if (storedIds) {
        const ids = JSON.parse(storedIds) as string[];
        this.bookmarkedIdsSubject.next(Array.isArray(ids) ? ids : []);
      }

      if (storedItems) {
        const items = JSON.parse(storedItems) as Resource[];
        this.bookmarkedResourcesSubject.next(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      console.warn('[BookmarkService] Failed to parse bookmarks from storage:', e);
    }
  }

  private persistToStorage(ids: string[], items: Resource[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(ids));
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('[BookmarkService] Failed to persist bookmarks to storage:', e);
    }
  }
}
