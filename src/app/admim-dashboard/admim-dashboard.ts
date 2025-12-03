import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialog } from '../upload-dialog/upload-dialog';
import { MapData,MapServices } from '../map-services';
import { CommonModule } from '@angular/common';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-admim-dashboard',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, FormsModule],
  templateUrl: './admim-dashboard.html',
  styleUrl: './admim-dashboard.css',
})
export class AdmimDashboard {

  constructor(private dialog:MatDialog,private mapService:MapServices){
    this.maps.push(this.map1,this.map2,this.map3);
  }
  maps: MapData[] = [];

  get totalMaps(): number {
    return this.maps.length;
  }

  map1: MapData = {
    id: 1,
    name: 'City Map',
    active: true,
    uploadedAt: new Date('2023-01-15'),
    url: 'https://res.cloudinary.com/dezwo04ym/raw/upload/v1764500503/rqp0jja3obhnqpizz1qq.gpx',
  };
  map2: MapData = {
    id: 2,
    name: 'Campus Map',
    active: false,
    uploadedAt: new Date('2023-01-15'),
    url: 'assets/maps/city-map.png',
  };
  map3: MapData = {
    id: 3,
    name: 'Warehouse Map',
    active: true,
    uploadedAt: new Date('2023-01-15'),
    url: 'assets/maps/city-map.png',
  };

  
  openDialog(){
    this.dialog.open(UploadDialog)
  }

  activeMenuId:number|null=null;

  toggleMenu(id:number){
    if(this.activeMenuId===id){
      this.activeMenuId=null;
    }else{
      this.activeMenuId=id;
    }
  }
 
  OnDownload(map:MapData){
    this.activeMenuId=null;
    if (!map.url) {
      alert('No file URL found for this map.');
      return;
    }
    this.mapService.OnDownloadMap(map.url, map.name);
  }
  OnDelete(map:MapData){
    this.activeMenuId=null;
    this.maps=this.maps.filter(m=>m.id!==map.id);
  }

  activeEditId:number|null=null;
  editableMap:MapData|null=null;
  OnEdit(map:MapData){
    this.activeMenuId=null;
    this.activeEditId=map.id;
    this.editableMap={...map};
  }
  cancelEdit() {
  this.activeEditId = null;
  this.editableMap = null;
}

  OnSave(){
    this.activeEditId=null;
    // this.mapService.OnUpdateMap(map);
     if (!this.editableMap) return;
     console.log('Saving map:', this.editableMap);
  
  // Find index of original map
  const index = this.maps.findIndex(m => m.id === this.editableMap!.id);
  if (index > -1) {
    // Update the original map with edited copy
    this.maps[index] = { ...this.editableMap };
  }
  this.cancelEdit();
  }
}
