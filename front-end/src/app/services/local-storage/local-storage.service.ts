import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() { }

  async set(key: string, value: any): Promise<void> {
    await Storage.set({
      key,
      value: JSON.stringify(value)
    });
  }

  async get(key: string): Promise<any> {
    return JSON.parse((await Storage.get({ key })).value);
  }

  async remove(key: string): Promise<void> {
    await Storage.remove({ key });
  }
}
