import { Component, OnInit } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth/auth.service';
import { ResponsiveService } from './services/responsive/responsive.service';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';
const { LocalNotifications } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  actions = [
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

  pages = [
    {
      title: 'Owned Plants',
      url: '/owned-plants'
    },
    {
      title: 'Guide',
      url: '/guide'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router,
    private menuController: MenuController
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    this.statusBar.styleDefault();
    this.splashScreen.hide();

    await this.autoLogin();
    
    if ((await LocalNotifications.requestPermission()).granted) {
      const now = new Date();
      const tomorrowFivePm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: 'Plantee',
            body: 'Daily check-in on your plants',
            schedule: {
              at: tomorrowFivePm,
              every: 'day'  
            }
          }
        ]
      });
    }
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
