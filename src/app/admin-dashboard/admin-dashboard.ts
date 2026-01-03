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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, FormsModule, ToastrModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard {
  constructor(
    private dialog: MatDialog,
    private mapService: MapServices,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.mapService.listAllMaps().subscribe((maps: any) => {
      let flattenedMaps = maps.data.map((mapObj: any) => {
        return {
          ...mapObj.map,
          views: mapObj.viewCount,
          downloads: mapObj.downloadCount,
        }
      });
      this.maps = flattenedMaps;
    });
  }

  maps: MapData[] = [];

  get totalMaps(): number {
    return this.maps.length;
  }

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
    this.mapService.OnDownloadMapFiles(map.id.toString(), map.gpxUrl, map.jsonUrl, map.name);
  }

  async OnDelete(map: MapData) {
    this.activeMenuId = null;
    this.maps = this.maps.filter((m) => m.id !== map.id);

    let res = await this.mapService.DeleteMap(map.id.toString())
        this.maps = this.maps.filter((m) => m.id !== map.id);
        this.toastr.success(`Map "${map.name}" deleted successfully.`, 'Success', {
          positionClass: 'toast-top-right',
          timeOut: 3000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
  }

  activeEditId: number | null = null;
  editableMap: MapData | null = null;

  OnEdit(map: MapData) {
    console.log(map);
    this.activeMenuId = null;
    this.activeEditId = map.id;
    this.editableMap = { ...map,
      active: map.status === 0, 
    visibility: map.visibility === 0 ? 'public' : 'private' 
    };
  }

  cancelEdit() {
    this.activeEditId = null;
    this.editableMap = null;
  }

  viewMap(mapUrl: string, mapName: string) {
    if (!mapUrl) {
      alert("Sorry, Map url doesn't exist!");
      return;
    }
    this.router.navigate(['/viewmap'], { queryParams: { mapname: mapName, mapurl: mapUrl } });
  }

  async onStatusChange(active: boolean) {
    this.toastr.info(`Map is set to ${(active) ? "active" : "inactive"}. Remember to save changes.`, 'Info', {
      positionClass: 'toast-top-right',
      timeOut: 2000,
      progressBar: true,
      easeTime: 400,
      toastClass: 'ngx-toastr slide-in',
    });
  }

  async OnSave() {
    try {
      this.activeEditId = null;
      let res = await this.mapService.OnUpdateMap(this.editableMap!)

          if(res.isSuccess){
            const updatedMap: MapData = res.data;
            const index = this.maps.findIndex((m) => m.id === updatedMap.id);
            if(index > -1){
              this.maps[index] = {
              ...updatedMap,
              active: updatedMap.status === 0, // ACTIVE
              visibility: updatedMap.visibility === 0 ? 'public' : 'private'
              };
            }
            this.toastr.success(`Map "${updatedMap.name}" updated successfully.`, 'Success', {
            positionClass: 'toast-top-right',
            timeOut: 3000,
            progressBar: true,
            easeTime: 400,
            toastClass: 'ngx-toastr slide-in',
          });
            console.log('Map updated successfully:', updatedMap);

          }
          else {
          console.error('Update failed:', res.errorMessage);
        }

        this.cancelEdit();
      }
      catch (err) {
        console.error('Error during map update:', err);
        this.toastr.error('Failed to update map. Please try again.', 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 5000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
      }
  }

  async signOut() {
    this.toastr.info('Signing you out...', 'Info', {
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      easeTime: 400,
      toastClass: 'ngx-toastr slide-in',
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    localStorage.clear();
    this.router.navigate(['/signin']);
  }
}
