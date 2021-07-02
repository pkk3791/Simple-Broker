import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage()
@Component({
  selector: "about",
  templateUrl: "about.html"
})
export class AboutPage {
  constructor(public navCtrl: NavController, public navParams: NavParams) {}
}
