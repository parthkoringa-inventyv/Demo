import { Injectable } from '@angular/core';

export interface User {
  userId: string;   // keyPath
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await this.openDatabase();
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("myDB", 1);

      // Runs ONLY when DB is first created or version changes
      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains('userList')) {
          db.createObjectStore('userList', {
            keyPath: 'userId',   // Primary key
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async addUser(user: User): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('userList', 'readwrite');
      const store = tx.objectStore('userList');

      store.add(user);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getUser(userId: string): Promise<User | undefined> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('userList', 'readonly');
      const store = tx.objectStore('userList');

      const request = store.get(userId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<User[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('userList', 'readonly');
      const store = tx.objectStore('userList');

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(user: User): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('userList', 'readwrite');
      const store = tx.objectStore('userList');

      store.put(user);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('userList', 'readwrite');
      const store = tx.objectStore('userList');

      store.delete(userId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}