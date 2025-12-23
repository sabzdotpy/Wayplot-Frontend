import axios from "../lib/axios";
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable, from } from 'rxjs';

export interface MapData{
  id: number;
  name: string;
  description: string;
  gpxUrl: string;
  jsonUrl: string;
  status: number;
  active: boolean;
  visibility: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MapServices {

  private baseurl=environment.ASP_API_URL+'/Map'
  // further works with mongo dB integration 

  constructor(){}

  listAllMaps(): Observable<MapData[]> {
    return from(
      axios.get<MapData[]>(this.baseurl).then(res => res.data)
    );
  }

  async downloadFile(url: string, fileName: string) {
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = response.data;
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert(`Failed to download "${fileName}". Please check the file or try again.`);
    }
  }

  async logDownload(mapId: string): Promise<boolean> {
    alert("logging download for mapId: " + mapId);
    let userId = localStorage.getItem('userId') || 'unknown';
    let res = await axios.post("Map/log-download", {
      mapId: mapId,
      actorId: userId
    });
    return res.data.success;
  }

  async OnDownloadMapFiles(id: string, gpxUrl: string, jsonUrl: string, baseFileName: string): Promise<void> {
    await this.downloadFile(gpxUrl, `${baseFileName}.gpx`);
    await this.logDownload(id);
    setTimeout(async () => {
      await this.downloadFile(jsonUrl, `${baseFileName}.json`);
    }, 500);
  }

  OnUpdateMap(map: MapData): Promise<any> {
    const updatedMap = {
      name: map.name,
      description: map.description,
      gpxUrl: map.gpxUrl,
      jsonUrl: map.jsonUrl,
      status: map.active ? 0 : 1,
      visibility: map.visibility == 'public' ? 0 : 1,
    };
    return axios.patch(`${this.baseurl}/${map.id}`, updatedMap);
    // update map details in database
  }

  DeleteMap(mapId: string): Promise<any> {
    return axios.delete(`${this.baseurl}/${mapId}`);
  }

  UploadMapDB(map: Partial<MapData>): Promise<MapData> {
    let uploaderId = localStorage.getItem('userId') || 'unknown';
    return axios.post<MapData>(`${this.baseurl}/${uploaderId}`, map).then(res => res.data);
  }
}
