import { Component, ViewChild } from "@angular/core";
import { Nav, Platform, Events } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Storage } from "@ionic/storage";

import { AuthProvider } from "../providers/auth/auth";

import { HomePage } from "../pages/home/home";
import { SearchPage } from "../pages/search/search";
import { SettingsPage } from "../pages/settings/settings";
import { LoginPage } from "../pages/login/login";
import { ProfilePage } from "../pages/profile/profile";
import { TwitterApiProvider } from "../providers/twitter-api/twitter-api";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  @ViewChild(Nav)
  nav: Nav;

  rootPage: any;
  pages: Array<{ title: string; icon: string; component: any }>;
  user: any;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private authProvider: AuthProvider,
    private twitter: TwitterApiProvider,
    private storage: Storage,
    private events: Events
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      statusBar.styleDefault();
      splashScreen.hide();
      this.initApp();

      this.events.subscribe("user:login", () => this.setUser());
    });

    this.pages = [
      { title: "Home", icon: "home", component: HomePage },
      { title: "Search", icon: "search", component: SearchPage },
      { title: "Settings", icon: "settings", component: SettingsPage }
    ];
  }

  async initApp() {
    const isLoggedIn = await this.authProvider.isLoggedIn();

    if (isLoggedIn) {
      this.rootPage = HomePage;
      await this.setUser();
    } else {
      this.rootPage = LoginPage;
    }
  }

  async setUser() {
    const userId = await this.storage.get("userId");
    this.user = await this.twitter.fetchUser(userId);
  }

  showProfile(userId) {
    this.nav.push(ProfilePage, { userId });
  }

  openPage(page) {
    if (page.component === HomePage) {
      this.nav.setRoot(HomePage);
    } else {
      this.nav.push(page.component);
    }
  }

  logout() {
    this.authProvider.logout();
    this.nav.setRoot(LoginPage);
  }

  get banner() {
    if (this.user.profile_banner_url) {
      return this.user.profile_banner_url;
    } else {
      return this.user.profile_background_image_url_https;
    }
  }
}
