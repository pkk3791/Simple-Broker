import { Component, Input } from "@angular/core";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";
import { PhotoViewer } from "@ionic-native/photo-viewer";

@Component({
  selector: "profile-header",
  templateUrl: "profile-header.html"
})
export class ProfileHeaderComponent {
  @Input()
  user: any;

  constructor(
    private twitter: TwitterApiProvider,
    private photoViewer: PhotoViewer
  ) {}

  get banner() {
    if (this.user.profile_banner_url) {
      return this.user.profile_banner_url + "/1500x500";
    } else {
      return this.user.profile_background_image_url_https;
    }
  }

  async follow(userId) {
    await this.twitter.createFriendship(userId);
    this.user.following = true;
  }

  async unfollow(userId) {
    await this.twitter.destroyFriendship(userId);
    this.user.following = false;
  }

  showProfilePicture() {
    const profilePicutreHighResUrl = this.user.profile_image_url_https.replace(
      "_normal",
      ""
    );
    this.photoViewer.show(profilePicutreHighResUrl, this.user.name, {
      share: true
    });
  }
}
