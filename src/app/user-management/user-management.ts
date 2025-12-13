// src/app/admin/user-management/user-management.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { UserService ,User} from '../user-service';
import { NgxSpinnerModule, NgxSpinnerService } from "ngx-spinner";


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,NgxSpinnerModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
})
export class UserManagement implements OnInit {
  
  users: User[] = [
    { id: 1, name: 'Admin User', email: 'admin@wayplot.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Doe', email: 'jane.d@wayplot.com', role: 'SuperAdmin', status: 'Active'},
    { id: 3, name: 'John Smith', email: 'john.s@wayplot.com', role: 'Regular', status: 'Inactive'},
  ];
  newUserForm!: FormGroup;
  editingUserId: number | null = null;
  editForms: { [key: number]: FormGroup } = {}; 
  isLoading: boolean = false;
  isCreating:boolean=false;

  constructor(private fb: FormBuilder, private userService:UserService,private spinner:NgxSpinnerService) {}

  ngOnInit() {
    this.initForms();
    // this.loadUsers();
  
  }
  
  initForms() {
    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['Regular', Validators.required],
      status:['Active',Validators.required]
    });
  }

  // --- Utility for Template Fix ---
  getEditControl(userId: number, controlName: string): FormControl {
      const control = this.editForms[userId].get(controlName);
      if (!control) {
          throw new Error(`Control ${controlName} not found for user ${userId}`);
      }
      return control as FormControl;
  }
  // --------------------------------

  // loadUsers() {
  //   this.isLoading = true;
  //   this.userService.getUsers().subscribe({
  //     next: (data) => {
  //       this.users = data;
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('Failed to load users', err);
  //       this.isLoading = false;
  //     }
  //   });
  // }
  
  createUser() {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }
    this.spinner.show();//===================>
    this.isCreating=true;
    
    this.userService.createUser(this.newUserForm.value).subscribe({
    
      next: (newUser) => {
        this.users.unshift(newUser); 
        this.newUserForm.reset({role:'Regular',status:'Active'});
      },
      error: (err) => {
        console.error('Failed to create user', err);
      },
      complete:() =>{
        this.isCreating=false;
        this.spinner.hide();
      },
    });
  }

  startEdit(user: User) {
    this.editingUserId = user.id;
    this.editForms[user.id] = this.fb.group({
      name: [user.name, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      role: [user.role, Validators.required],
      status: [user.status,Validators.required]
    });
  }

  saveEdit(userId: number) {
    const editForm = this.editForms[userId];
    if (editForm.invalid) {
      editForm.markAllAsTouched();
      return;
    }
    
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const updatedUser: User = { 
        ...this.users[userIndex], 
        ...editForm.value 
      };


      this.userService.updateUser(updatedUser).subscribe({
        next: (responseUser) => {
          this.users[userIndex] = responseUser;
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Failed to update user', err);
        }
      });
    }
  }

  deleteUser(userId: number, userName: string) {
    if (confirm(`Are you sure you want to delete user: ${userName}?`)) {
      this.users = this.users.filter(u => u.id !== userId);
      this.userService.deleteUser(userId).subscribe({
        next: (success) => {
          if (success) {
            this.users = this.users.filter(u => u.id !== userId);
          }
        },
        error: (err) => {
          console.error('Failed to delete user', err);
        }
      });
    }
  }

  cancelEdit() {
    this.editingUserId = null;
    this.editForms = {}; 
  }

  get newF() { return this.newUserForm.controls; }
}