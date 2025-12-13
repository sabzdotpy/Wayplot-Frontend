
// src/app/interfaces/user.interface.ts

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  status:string;
}

// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  // Mock Backend Data Store
  private mockUsers: User[] = [
    
  ];

  constructor() {}

  getUsers(): Observable<User[]> {
    return of(this.mockUsers).pipe(delay(500));
  }

  createUser(userData: Partial<User>): Observable<User> {
    const newUser: User = {
      ...userData,
      id: Date.now(), 

    } as User;
    
    // this.mockUsers.unshift(newUser);
    return of(newUser).pipe(delay(300));
  }

  updateUser(updatedUser: User): Observable<User> {
    const index = this.mockUsers.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
      this.mockUsers[index] = updatedUser;
    }
    return of(updatedUser).pipe(delay(300));
  }
  
  deleteUser(id: number): Observable<boolean> {
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    return of(this.mockUsers.length < initialLength).pipe(delay(300));
  }
}