// src/app/admin/user-management/user-management.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { UserService ,User,ApiUserResponse} from '../user-service';
import { NgxSpinnerModule, NgxSpinnerService } from "ngx-spinner";
import { environment } from '../../Environment/environment';
import { UserRole,UserStatus } from '../user-service';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,NgxSpinnerModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
})
export class UserManagement implements OnInit {
  private baseurl=environment.ASP_API_URL;
  public UserRole = UserRole;
  public UserStatus=UserStatus;
  public rolesOptions = [
  { name: 'Super Admin', value: UserRole.SuperAdmin }, // value is 0
  { name: 'Admin', value: UserRole.Admin },           // value is 1
  { name: 'Regular', value: UserRole.Regular }        // value is 2
];
public statusOptions=[
  {name:'Active',value:UserStatus.ACTIVE},
  {name:'Inactive',value:UserStatus.INACTIVE},
  {name:'Disabled',value:UserStatus.DISABLED},
  {name:'Banned',value:UserStatus.BANNED},
  {name:'Suspended',value:UserStatus.SUSPENDED},
  {name:'Deleted',value:UserStatus.DELETED} ]
  
  users: ApiUserResponse[] = [
    
  ];
  newUserForm!: FormGroup;
  editingUserId: any | null = null;
  editForms: { [key: string]: FormGroup } = {}; 
  isLoading: boolean = false;
  isCreating:boolean=false;

  constructor(private fb: FormBuilder, private userService:UserService,private spinner:NgxSpinnerService) {}

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
      status:['Active',Validators.required]
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

  loadUsers() {
    this.isLoading = true;
    this.spinner.show();
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }
  
  createUserr() {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }
    console.log(this.newUserForm.value);
    this.spinner.show();
    this.isCreating=true;
    
    this.userService.createUser(this.newUserForm.value).subscribe({
    
      next: (data) => {
        if(data.isSuccess){
          alert(`User ${data.name} created successfully!`);
          this.newUserForm.reset({role:UserRole.Regular,status:'Active'});
        }else{
          alert(`Failed to create user: ${data.errorMessage}`);
        }
        
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

  startEdit(user: ApiUserResponse) {
    this.editingUserId = user.id;
    this.editForms[user.id] = this.fb.group({
      name: [user.name, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      role: [user.role, Validators.required],
      status: [user.status,Validators.required]
    });
  }

  saveEdit(userId: string) {
    const editForm = this.editForms[userId];
    if (editForm.invalid) {
      editForm.markAllAsTouched();
      return;
    }
    
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const updatedUser: ApiUserResponse = { 
        ...this.users[userIndex], 
        ...editForm.value 
      };
      console.log(updatedUser);


      this.userService.updateUser(updatedUser).subscribe({
        next: (responseUser) => {
          this.users[userIndex] = responseUser;
          this.cancelEdit();
          alert(`User ${responseUser.name} updated successfully!`);
        },
        error: (err) => {
          console.error('Failed to update user', err);
          alert('Failed to update user. Please try again.');
        }
      });
    }
  }

  deleteUser(userId: any, userName: string) {
    if (confirm(`Are you sure you want to delete user: ${userName}?`)) {
      this.userService.deleteUser(userId).subscribe({
        next: (success) => {
            // Filter the user out locally (efficient)
            this.users = this.users.filter(u => u.id !== userId); 
            
            // You can use the 'success' string from the API here if needed:
            alert(`${success} (User: ${userName})`);
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