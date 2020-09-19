import { ResponsiveService } from '../../src/app/services/responsive/responsive.service';
import { LoadingController, ToastController } from '@ionic/angular';

export class MockResponsiveService extends ResponsiveService {
    private isLoading: boolean;
  
    constructor() {
        super(null, null);
        this.isLoading = false;
    }
  
    get duration(): number {
        return 3000;
    }
  
    get loading(): boolean {
        return this.isLoading;
    }
  
    async setLoadingMessage(message: string = ''): Promise<void> {
        this.isLoading = true;
    }
  
    async stopLoading(): Promise<void> {
        this.isLoading = false;
    }
  
    async setSuccessMessage(message: string): Promise<void> {
        this.isLoading = false;
    }
  
    async setWarningMessage(message: string): Promise<void> {
        this.isLoading = false;
    }
  
    async setErrorMessage(error): Promise<void> {
        this.isLoading = false;
    }
};