import axios from "../lib/axios";
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface GpxUploadResponse {
  status: string;
  message: string;
  cloudinary_gpx_url: string;
  cloudinary_json_url: string;
  nodes: number;
  edges: number;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {

  constructor(){}

  private apiUrl=`${environment.DJANGO_API_URL}/routing/upload_gpx/`
  
  async UploadToCloudinary(file: File): Promise<GpxUploadResponse> {
    const formData = new FormData();
    formData.append('gpx_file', file, file.name);
    const res = await axios.post<GpxUploadResponse>(this.apiUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000
    });
    return res.data;
  }


  
}
