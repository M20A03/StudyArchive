import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceService, Resource } from '../../../services/resource.service';

@Component({
    selector: 'app-my-resources',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-resources.component.html',
    styleUrl: './my-resources.component.scss'
})
export class MyResourcesComponent {
    myResources: Resource[] = [];

    constructor(private resourceService: ResourceService) {
        this.resourceService.resources$.subscribe(resources => {
            this.myResources = resources;
        });
    }

    deleteResource(res: Resource) {
        if (confirm(`Are you sure you want to delete "${res.title}"?`)) {
            this.resourceService.deleteResource(res.id);
        }
    }

    togglePrivacy(res: Resource) {
        this.resourceService.togglePrivacy(res.id);
    }

    editResource(res: Resource) {
        const title = prompt('Update resource title', res.title);
        if (!title || !title.trim()) return;
        this.resourceService.updateResource(res.id, { title: title.trim() });
    }
}
