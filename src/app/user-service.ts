import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../environments/environment';
import axios from "../lib/axios";
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
  


  constructor(){}

  getUsers(): Promise<ApiUserResponse[]> {
    return axios.get<ApiUserResponse[]>(`${this.baseurl}/User/all`).then(res => res.data);
  }

  createUser(userData: Partial<User>): Promise<AuthResponseWrapper> {
    const newUser: Partial<User> = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      authType: AuthType.OAUTH,
      userRole: userData.userRole,
      scopes: userData.scopes
    };
    console.log(newUser);
    return axios.post<AuthResponseWrapper>(`${this.baseurl}/Auth/signUp`, newUser).then(res => res.data);
  }

  updateUser(updatedUser: ApiUserResponse): Promise<ApiUserResponse> {
    const id = updatedUser.id;
    const patchBody = {
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      authType: updatedUser.authType,
      role: updatedUser.role,
      status: updatedUser.status,
      scopes: [updatedUser.scopes]
    };
    return axios.patch<ApiUserResponse>(`${this.baseurl}/User/${id}`, patchBody).then(res => res.data);
  }
  
  deleteUser(id: string): Promise<string> {
    return axios.delete(`${this.baseurl}/User/${id}`).then(res => res.data);
  }
}