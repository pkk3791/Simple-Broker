import { Component, Input } from "@angular/core";
import { App } from "ionic-angular";
import { ProfilePage } from "../../pages/profile/profile";

@Component({
  selector: "mention",
  templateUrl: "mention.html"
})
export class MentionComponent {
  @Input()
  username: string;
  @Input()
  userId: string;

  constructor(private appCtrl: App) {}

  showProfile(userId) {
    this.appCtrl.getRootNav().push(ProfilePage, { userId });
  }
}
