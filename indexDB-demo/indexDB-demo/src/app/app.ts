import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IndexedDbService, User } from './index-db-service';
import { Component, signal, inject } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('indexDB-demo');
  private dbService = inject(IndexedDbService);
  private fb = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly editingUserId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required]]
  });

  async ngOnInit() {
    await this.dbService.init();
    await this.loadUsers();
  }

  async loadUsers() {
    const data = await this.dbService.getAllUsers();
    this.users.set(data);
  }

  async submit() {
    if (this.form.invalid) return;

    const user = this.form.getRawValue();

    if (this.editingUserId()) {
      await this.dbService.updateUser(user);
      this.editingUserId.set(null);
    } else {
      await this.dbService.addUser(user);
    }

    this.form.reset();
    await this.loadUsers();
  }

  edit(user: User) {
    this.form.setValue(user);
    this.editingUserId.set(user.userId);
  }

  async delete(userId: string) {
    await this.dbService.deleteUser(userId);
    await this.loadUsers();
  }

  cancelEdit() {
    this.editingUserId.set(null);
    this.form.reset();
  }
}