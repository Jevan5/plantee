import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() { }

  async set(key: string, value: string): Promise<void> {
    await Storage.set({
      key,
      value
    });
  }

  async get(key: string): Promise<string> {
    return (await Storage.get({ key })).value;
  }

  async remove(key: string): Promise<void> {
    await Storage.remove({ key });
  }
}
