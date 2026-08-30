import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../../services/resource.service';
import { Resource } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';

@Component({
    selector: 'app-my-resources',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './my-resources.component.html',
    styleUrl: './my-resources.component.scss'
})
export class MyResourcesComponent {
    private resourceService = inject(ResourceService);
    private toastService = inject(ToastService);

    myResources: Resource[] = [];

    editingResource: Resource | null = null;
    editTitleInput = '';
    deleteTargetResource: Resource | null = null;

    constructor() {
        this.resourceService.resources$.subscribe((resources) => {
            this.myResources = resources;
        });
    }

    openEditModal(res: Resource) {
        this.editingResource = res;
        this.editTitleInput = res.title;
    }

    closeEditModal() {
        this.editingResource = null;
        this.editTitleInput = '';
    }

    saveEdit() {
        if (!this.editingResource || !this.editTitleInput.trim()) return;
        this.resourceService.updateResource(this.editingResource.id, {
            title: this.editTitleInput.trim()
        });
        this.closeEditModal();
    }

    promptDelete(res: Resource) {
        this.deleteTargetResource = res;
    }

    confirmDelete() {
        if (!this.deleteTargetResource) return;
        this.resourceService.deleteResource(this.deleteTargetResource.id);
        this.deleteTargetResource = null;
    }

    cancelDelete() {
        this.deleteTargetResource = null;
    }

    togglePrivacy(res: Resource) {
        this.resourceService.togglePrivacy(res.id);
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
