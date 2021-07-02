import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  MenuController,
  AlertController,
  ModalController,
  Events
} from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";
import { AboutPage } from "../about/about";
import { HomePage } from "../home/home";

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html"
})
export class LoginPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController,
    private authProvider: AuthProvider,
    private modalCtrl: ModalController,
    private events: Events
  ) {}

  ionViewDidLoad() {
    this.menuCtrl.enable(false, "sideNav");
  }

  login() {
    const alertText = {
      title: "Login failed",
      subTitle:
        "Somthing went wrong while trying to log you in. Please try again.",
      buttons: ["OK"]
    };

    this.authProvider
      .login()
      .then(() => this.events.publish("user:login"))
      .then(() => this.navCtrl.setRoot(HomePage))
      .catch(err => this.alertCtrl.create(alertText).present());
  }

  showAbout() {
    this.modalCtrl.create(AboutPage).present();
  }
}
