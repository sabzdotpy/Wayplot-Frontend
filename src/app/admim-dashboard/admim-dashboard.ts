import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialog } from '../upload-dialog/upload-dialog';
import { MapData, MapServices } from '../map-services';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admim-dashboard',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, FormsModule, ToastrModule, RouterLink],
  templateUrl: './admim-dashboard.html',
  styleUrl: './admim-dashboard.css',
})
export class AdmimDashboard {
  constructor(
    private dialog: MatDialog,
    private mapService: MapServices,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.mapService.listAllMaps().subscribe((maps: any) => {
      this.maps = maps.data;
    });
  }

  maps: MapData[] = [];

  get totalMaps(): number {
    return this.maps.length;
  }

  // map1: MapData = {
  //   id: 1,
  //   name: 'Kalasalingam Campus Map v2',
  //   description: 'Detailed map of all campus roads.',
  //   active: true,
  //   uploadedAt: new Date('2025-12-12'),
  //   gpxUrl:
  //     'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765508403/gpx_graphs/raw_gpx/KLU_Campus_All_Roads_42014d5c',
  //   jsonUrl:
  //     'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765508404/gpx_graphs/json_graph/KLU_Campus_All_Roads',
  //   visibility: 'Public',
  // };

  // map2: MapData = {
  //   id: 2,
  //   name: 'Kalasalingam University',
  //   description: 'Full walking path track.',
  //   active: true,
  //   uploadedAt: new Date('2025-12-10'),
  //   gpxUrl:
  //     'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465963/gpx_graphs/raw_gpx/klu_full_walk_2684dcf9',
  //   jsonUrl:
  //     'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465966/gpx_graphs/json_graph/klu_full_walk',
  //   visibility: 'Public',
  // };

  // map3: MapData = {
  //   id: 3,
  //   name: 'Warehouse Map',
  //   description: 'Internal warehouse layout.',
  //   active: true,
  //   uploadedAt: new Date('2025-12-03'),
  //   gpxUrl: 'assets/maps/city-map.png',
  //   jsonUrl: '',
  //   visibility: 'Private',
  // };

  ngOnInit() {
    if (!localStorage.getItem('token')) {
      this.toastr.error('No token found. Please sign in.', 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
      this.router.navigate(['/signin']);
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(UploadDialog);

    dialogRef.afterClosed().subscribe((result: MapData | undefined) => {
      if (result && result.name && result.jsonUrl) {
        this.maps.unshift(result);

        console.log('New map added to dashboard list:', result);
      } else if (result) {
        console.warn('Dialog closed, but no complete map data returned.');
      }
    });
  }

  activeMenuId: number | null = null;

  toggleMenu(id: number) {
    if (this.activeMenuId === id) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = id;
    }
  }

  OnDownload(map: MapData) {
    this.activeMenuId = null;
    if (!map.gpxUrl) {
      alert('No file URL found for this map.');
      return;
    }
    this.mapService.OnDownloadMapFiles(map.gpxUrl, map.jsonUrl, map.name);
  }
  OnDelete(map: MapData) {
    this.activeMenuId = null;
    this.maps = this.maps.filter((m) => m.id !== map.id);

    this.mapService.DeleteMap(map.id.toString()).subscribe({
      next: () => {
        this.maps = this.maps.filter((m) => m.id !== map.id);
        this.toastr.success(`Map "${map.name}" deleted successfully.`, 'Success', {
          positionClass: 'toast-top-right',
          timeOut: 3000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
      }
    });
  }

  activeEditId: number | null = null;
  editableMap: MapData | null = null;
  OnEdit(map: MapData) {
    this.activeMenuId = null;
    this.activeEditId = map.id;
    this.editableMap = { ...map };
  }
  cancelEdit() {
    this.activeEditId = null;
    this.editableMap = null;
  }

  OnSave() {
    this.activeEditId = null;
    // this.mapService.OnUpdateMap(map);
    if (!this.editableMap) return;
    console.log('Saving map:', this.editableMap);

    // Find index of original map
    const index = this.maps.findIndex((m) => m.id === this.editableMap!.id);
    if (index > -1) {
      // Update the original map with edited copy
      this.maps[index] = { ...this.editableMap };
    }
    this.cancelEdit();
  }

  async signOut() {
    this.toastr.info('Signing you out...', 'Info', {
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      easeTime: 400,
      toastClass: 'ngx-toastr slide-in',
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.clear();
    this.router.navigate(['/signin']);
  }
}
