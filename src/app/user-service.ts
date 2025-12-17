import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../Environment/environment';
import { HttpClient } from '@angular/common/http';
import { user } from '@angular/fire/auth';

export interface AuthResponseWrapper {
  isSuccess: boolean;
  token: string;
  name: string;
  role: string; // The API returns the role as a string name!
  errorMessage: string | null;
}

export interface ApiUserResponse {
  id: string;
  name: string;
  email: string;
  password: string; 
  authType: number;        // API sends number (1)
  role: number;            // API sends number (2) - Mismatch with User.userRole
  status: number;
  createdAt: string;
  updatedAt: string;
  scopes: string[]; 
  sharedMaps: any[]; // Assuming this is an array of some type
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; 
  authType: AuthType; 
  userRole: UserRole; 
  scopes: string[]; 
}
export enum UserRole {
  SuperAdmin=0,
  Admin = 1,
  Regular = 2,
 
}
 export enum AuthType
 {
     OAUTH=0,
     PASSWORD=1
 }

    export enum UserStatus
    {
        ACTIVE=0,
        INACTIVE=1,
        DISABLED=2,
        BANNED=3,
        SUSPENDED=4,
        DELETED=5
    }




@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseurl=environment.ASP_API_URL;
  


  constructor(private http:HttpClient) {}

  getUsers(): Observable<ApiUserResponse[]> {
    return this.http.get<ApiUserResponse[]>(`${this.baseurl}/User/all`);
  }

  createUser(userData: Partial<User>): Observable<AuthResponseWrapper> {
    const newUser:Partial< User> = {
      name:userData.name,
      email:userData.email,
      password:userData.password,
      authType:AuthType.OAUTH,
      userRole:userData.userRole,
      scopes:userData.scopes
    };
    console.log(newUser);
    return this.http.post<AuthResponseWrapper>(`${this.baseurl}/Auth/signUp`,newUser);
  }

  updateUser(updatedUser: ApiUserResponse): Observable<ApiUserResponse> {
    const id=updatedUser.id;
    const patchBody={
      name:updatedUser.name,
      email:updatedUser.email,
      password:updatedUser.password,
      authType:updatedUser.authType,
      role:updatedUser.role,
      status:updatedUser.status,
      scopes:[updatedUser.scopes]
    }
    return this.http.patch<ApiUserResponse>(`${this.baseurl}/User/${id}`, patchBody);
    
  }
  
  deleteUser(id: string): Observable<string> {
    return this.http.delete(`${this.baseurl}/User/${id}`,{ responseType: 'text' });
  }
}