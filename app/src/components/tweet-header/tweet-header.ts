import { Component, Input } from "@angular/core";
import { ActionSheetController, App } from "ionic-angular";
import { ProfilePage } from "../../pages/profile/profile";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";

@Component({
  selector: "tweet-header",
  templateUrl: "tweet-header.html"
})
export class TweetHeaderComponent {
  @Input()
  user: any[];
  @Input()
  tweetCreatedAt: string;

  constructor(
    private appCtrl: App,
    public actionSheetCtrl: ActionSheetController,
    private twitter: TwitterApiProvider
  ) {}

  showProfile(userId) {
    this.appCtrl.getRootNav().push(ProfilePage, { userId });
  }

  showActions(userId) {
    this.twitter.fetchUser(userId).then(user => {
      this.actionSheetCtrl
        .create({
          title: "@" + this.user["screen_name"],
          buttons: this.getButtonsForActionSheet(user)
        })
        .present();
    });
  }

  private getButtonsForActionSheet(user) {
    const buttons = [];
    if (user.following) {
      // Unfollow
      buttons.push({
        text: "Unfollow",
        role: "destructive",
        handler: () => {
          this.twitter.destroyFriendship(user.id_str);
        }
      });
    } else {
      // Follow
      buttons.push({
        text: "Follow",
        role: "destructive",
        handler: () => {
          this.twitter.createFriendship(user.id_str);
        }
      });
    }

    if (user.muting) {
      // unmute
      buttons.push({
        text: "Unmute",
        role: "destructive",
        handler: () => {
          this.twitter.unmuteUser(user.id_str);
        }
      });
    } else {
      // mute
      buttons.push({
        text: "Mute",
        role: "destructive",
        handler: () => {
          this.twitter.muteUser(user.id_str);
        }
      });
    }

    if (user.blocking) {
      // Unblock
      buttons.push({
        text: "Unblock",
        role: "destructive",
        handler: () => {
          this.twitter.unblockUser(user.id_str);
        }
      });
    } else {
      // Block
      buttons.push({
        text: "Block",
        role: "destructive",
        handler: () => {
          this.twitter.blockUser(user.id_str);
        }
      });
    }

    // Cancel button
    buttons.push({
      text: "Cancel",
      role: "cancel"
    });

    return buttons;
  }
}
