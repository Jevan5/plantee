import { Component, OnInit, enableProdMode } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth/auth.service';
import { ResponsiveService } from './services/responsive/responsive.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  private actions = [
    {
      title: 'Logout',
      func: async () => {
        try {
          const user = this.auth.user;
          await this.responsive.setLoadingMessage('Logging out');
          await this.auth.logout();
          await this.router.navigateByUrl('/login');
          await this.responsive.setSuccessMessage(`Goodbye, ${user.firstName}`);
        } catch (err) {
          await this.responsive.setErrorMessage(err);
        }
      }
    }
  ];

  private pages = [
    {
      title: 'Owned Plants',
      url: '/owned-plants'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router
  ) {
    this.initializeApp();

    this.autoLogin();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  async autoLogin(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage('Attempting to auto-login');
      const user = await this.auth.loginFromStorage();
      await this.router.navigateByUrl('/owned-plants');
      await this.responsive.setSuccessMessage(`Welcome back, ${user.firstName}`);
    } catch (err) {
      await this.responsive.stopLoading();
    }
  }

  ngOnInit() { }
}
