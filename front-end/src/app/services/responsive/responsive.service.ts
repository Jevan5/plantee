import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import ErrorHelper from 'src/app/utils/errorHelper';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  private _loading: boolean;
  private loader: HTMLIonLoadingElement;
  private toast: HTMLIonToastElement;

  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this._loading = false;
    this.loader = null;
    this.toast = null;
  }

  get duration(): number {
    return 3000;
  }

  get errorDuration(): number {
    return 5000;
  }

  get loading(): boolean {
    return this._loading;
  }

  async setLoadingMessage(message: string = ''): Promise<void> {
    if (this.loading) {
      this.loader.setAttribute('message', message);
    } else {
      this.loader = await this.loadingController.create({ message });
      await this.loader.present();
    }

    this._loading = true;
  }

  async stopLoading(): Promise<void> {
    if (this.loading) await this.loader.dismiss();

    this._loading = false;
  }

  private async clearAll(): Promise<void> {
    await this.stopLoading();

    if (this.toast !== null) await this.toast.dismiss();
  }

  async setSuccessMessage(message: string): Promise<void> {
    await this.setToastMessage(message, 'success');
  }

  async setWarningMessage(message: string): Promise<void> {
    await this.setToastMessage(message, 'warning');
  }

  async setErrorMessage(error): Promise<void> {
    await this.setToastMessage(`Error: ${ErrorHelper.getUserMessageFromError(error)}`, 'danger');
  }

  private async setToastMessage(message: string, color: string): Promise<void> {
    await this.clearAll();

    this.toast = await this.toastController.create({
      color,
      duration: color === 'danger' ? this.errorDuration : this.duration,
      message
    });

    await this.toast.present();
  }
}
