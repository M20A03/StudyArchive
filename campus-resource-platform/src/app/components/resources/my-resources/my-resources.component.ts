import { Component, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../services/resource.service';
import { BookmarkService } from '../../../core/bookmark.service';
import { Resource } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-my-resources',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-resources.component.html',
  styleUrl: './my-resources.component.scss'
})
export class MyResourcesComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private bookmarkService = inject(BookmarkService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  activeTab: 'uploads' | 'bookmarks' = 'uploads';

  myResources: Resource[] = [];
  bookmarkedResources: Resource[] = [];

  editingResource: Resource | null = null;
  editTitleInput = '';
  editSubjectInput = '';
  editCategoryInput = '';
  deleteTargetResource: Resource | null = null;

  ngOnInit(): void {
    this.resourceService.resources$.subscribe((resources) => {
      this.myResources = resources;
    });

    this.bookmarkService.bookmarkedResources$.subscribe((bookmarks) => {
      this.bookmarkedResources = bookmarks;
    });
  }

  setActiveTab(tab: 'uploads' | 'bookmarks') {
    this.activeTab = tab;
  }

  openEditModal(res: Resource) {
    this.editingResource = res;
    this.editTitleInput = res.title;
    this.editSubjectInput = res.subject || '';
    this.editCategoryInput = res.category || 'Lecture Notes';
  }

  closeEditModal() {
    this.editingResource = null;
    this.editTitleInput = '';
    this.editSubjectInput = '';
    this.editCategoryInput = '';
  }

  saveEdit() {
    if (!this.editingResource || !this.editTitleInput.trim()) return;
    this.resourceService.updateResource(this.editingResource.id, {
      title: this.editTitleInput.trim(),
      subject: this.editSubjectInput.trim() || this.editingResource.subject,
      category: this.editCategoryInput.trim() || this.editingResource.category
    });
    this.toastService.success(`Updated "${this.editTitleInput.trim()}" successfully!`, 'Resource Updated');
    this.closeEditModal();
  }

  promptDelete(res: Resource) {
    this.deleteTargetResource = res;
  }

  confirmDelete() {
    if (!this.deleteTargetResource) return;
    const title = this.deleteTargetResource.title;
    this.resourceService.deleteResource(this.deleteTargetResource.id);
    this.deleteTargetResource = null;
    this.toastService.info(`"${title}" has been deleted.`, 'Resource Removed');
  }

  cancelDelete() {
    this.deleteTargetResource = null;
  }

  togglePrivacy(res: Resource) {
    this.resourceService.togglePrivacy(res.id);
    const newStatus = res.privacy === 'Public' ? 'Private' : 'Public';
    this.toastService.success(`Visibility set to ${newStatus}.`, 'Privacy Updated');
  }

  removeBookmark(res: Resource) {
    this.bookmarkService.removeBookmark(res.id);
    this.toastService.info(`Removed "${res.title}" from saved bookmarks.`, 'Bookmark Removed');
  }

  copyShareLink(res: Resource) {
    if (!this.isBrowser) return;
    const url = window.location.origin + '/dashboard/search?resourceId=' + res.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.success('Resource link copied to clipboard!', 'Link Copied');
      });
    } else {
      this.toastService.info(url, 'Resource Link');
    }
  }

  downloadResource(res: Resource) {
    this.resourceService.incrementDownloads(res.id);
    res.downloads = (res.downloads || 0) + 1;
    this.toastService.success(`Downloading "${res.title}"...`, 'Download Started');
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.editingResource) {
      this.closeEditModal();
    }
    if (this.deleteTargetResource) {
      this.cancelDelete();
    }
  }
}
