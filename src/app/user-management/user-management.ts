// src/app/admin/user-management/user-management.component.ts

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, ApiUserResponse } from '../user-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';
import { UserRole, UserStatus } from '../user-service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxSpinnerModule, ToastrModule, RouterLink],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
})
export class UserManagement implements OnInit {
  private baseurl = environment.ASP_API_URL;
  public UserRole = UserRole;
  public UserStatus = UserStatus;
  public rolesOptions = [
    { name: 'Super Admin', value: UserRole.SuperAdmin }, // value is 0
    { name: 'Admin', value: UserRole.Admin }, // value is 1
    { name: 'Regular', value: UserRole.Regular }, // value is 2
  ];
  public statusOptions = [
    { name: 'Active', value: UserStatus.ACTIVE },
    { name: 'Inactive', value: UserStatus.INACTIVE },
    { name: 'Disabled', value: UserStatus.DISABLED },
    { name: 'Banned', value: UserStatus.BANNED },
    { name: 'Suspended', value: UserStatus.SUSPENDED },
    { name: 'Deleted', value: UserStatus.DELETED },
  ];

  users: ApiUserResponse[] = [];
  newUserForm!: FormGroup;
  editingUserId: any | null = null;
  editForms: { [key: string]: FormGroup } = {};
  isLoading: boolean = false;
  isCreating: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.initForms();
    this.loadUsers();
  }

  initForms() {
    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userRole: [UserRole.Regular, Validators.required],
      status: ['Active', Validators.required],
    });
  }

  // --- Utility for Template Fix ---
  getEditControl(userId: any, controlName: string): FormControl {
    const control = this.editForms[userId].get(controlName);
    if (!control) {
      throw new Error(`Control ${controlName} not found for user ${userId}`);
    }
    return control as FormControl;
  }
  // --------------------------------

  async loadUsers() {
    this.isLoading = true;
    this.spinner.show();
    try {
      let res: ApiUserResponse[] = await this.userService.getUsers();
      this.users = res;
      this.isLoading = false;
      this.spinner.hide();
    } catch (err: any) {
      console.error('Failed to load users', err);
      this.isLoading = false;
      this.spinner.hide();
    }
  }

  async createUserr() {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }
    console.log(this.newUserForm.value);
    this.spinner.show();
    this.isCreating = true;

    let res = await this.userService.createUser(this.newUserForm.value);

    if (res.isSuccess) {
      this.toastr.success(`User ${res.name} created successfully! `, 'Success', {
        positionClass: 'toast-top-right',
        timeOut: 3500,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
    } else {
      this.toastr.error(`Failed to create user: ${res.errorMessage}`, 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
    }
    this.newUserForm.reset();
    this.isCreating = false;
    this.spinner.hide();
    this.loadUsers();
  }

  startEdit(user: ApiUserResponse) {
    this.editingUserId = user.id;
    this.editForms[user.id] = this.fb.group({
      name: [user.name, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      role: [user.role, Validators.required],
      status: [user.status, Validators.required],
      scopes: [user.scopes || ''],
    });
  }

  async saveEdit(userId: string) {
    const editForm = this.editForms[userId];
    if (editForm.invalid) {
      editForm.markAllAsTouched();
      return;
    }

    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      const updatedUser: ApiUserResponse = {
        ...this.users[userIndex],
        ...editForm.value,
      };
      console.log(updatedUser);

      let res = await this.userService.updateUser(updatedUser);
      this.users[userIndex] = res;
      this.cancelEdit();
      this.toastr.success(`User ${res.name} updated successfully!`, 'Success', {
        positionClass: 'toast-top-right',
        timeOut: 3500,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
    }
  }

  async deleteUser(userId: any, userName: string) {
    try {
      if (confirm(`Are you sure you want to delete user: ${userName}?`)) {
        let res = await this.userService.deleteUser(userId);
        // Filter the user out locally (efficient)
        this.users = this.users.filter((u) => u.id !== userId);

        // alert(`${success} (User: ${userName})`);
        this.toastr.success(`The user: ${userName} deleted successfully `, 'Success', {
          positionClass: 'toast-top-right',
          timeOut: 3500,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
      }
    } catch (err) {
      console.error('Delete user failed', err);
      this.toastr.error(`Failed to delete user: ${userName}`, 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
    }
  }

  cancelEdit() {
    this.editingUserId = null;
    this.editForms = {};
  }

  get newF() {
    return this.newUserForm.controls;
  }
}
