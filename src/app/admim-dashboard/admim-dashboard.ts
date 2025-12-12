import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialog } from '../upload-dialog/upload-dialog';
import { MapData, MapServices } from '../map-services';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admim-dashboard',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, FormsModule, ToastrModule],
  templateUrl: './admim-dashboard.html',
  styleUrl: './admim-dashboard.css',
})

export class AdmimDashboard {
  constructor(private dialog: MatDialog, private mapService: MapServices, private toastr: ToastrService, private router: Router) {
    this.maps.push(this.map1, this.map2, this.map3);
  }
  maps: MapData[] = [];

  get totalMaps(): number {
    return this.maps.length;
  }

  map1: MapData = {
    id: 1,
    name: 'Kalasalingam Campus Map v2',
    active: true,
    uploadedAt: new Date('2023-01-15'),
    gpx_url:
      'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765508403/gpx_graphs/raw_gpx/KLU_Campus_All_Roads_42014d5c',
    json_url:
      'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765508404/gpx_graphs/json_graph/KLU_Campus_All_Roads',
  };
  map2: MapData = {
    id: 2,
    name: 'Kalasalingam University',
    active: true,
    uploadedAt: new Date('2023-01-15'),
    gpx_url:
      'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465963/gpx_graphs/raw_gpx/klu_full_walk_2684dcf9',
    json_url:
      'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465966/gpx_graphs/json_graph/klu_full_walk',
  };
  map3: MapData = {
    id: 3,
    name: 'Warehouse Map',
    active: true,
    uploadedAt: new Date('2023-01-15'),
    gpx_url: 'assets/maps/city-map.png',
    json_url: '',
  };

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

    // remove==> after db integration============================================================>
    dialogRef.afterClosed().subscribe((result: MapData | undefined) => {
      if (result && result.name && result.json_url) {
        const newMap: MapData = {
          id: 5,
          name: result.name,
          gpx_url: result.gpx_url,
          active: result.active,
          json_url: result.json_url,
          uploadedAt: result.uploadedAt,
        };

        // 3. Add the new map to the existing array
        this.maps.unshift(newMap); // Adds to the beginning of the list

        console.log('New map added to dashboard list:', newMap);
      } else if (result) {
        // Handle case where dialog closed but didn't return complete data (e.g., failed upload, but dialog closed)
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
    if (!map.gpx_url) {
      alert('No file URL found for this map.');
      return;
    }
    this.mapService.OnDownloadMapFiles(map.gpx_url, map.json_url, map.name);
  }
  OnDelete(map: MapData) {
    this.activeMenuId = null;
    this.maps = this.maps.filter((m) => m.id !== map.id);
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

  signOut() {
    localStorage.clear();
    this.router.navigate(['/signin']);
  }
}
