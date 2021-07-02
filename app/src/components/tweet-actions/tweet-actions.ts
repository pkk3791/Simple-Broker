import { Component, Input, ChangeDetectorRef } from "@angular/core";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";
import { NavController } from "ionic-angular";
import { WriteTweetPage } from "../../pages/write-tweet/write-tweet";
import { P2pDatabaseGunProvider } from "../../providers/p2p-database-gun/p2p-database-gun";
import { Vibration } from "@ionic-native/vibration";

@Component({
  selector: "tweet-actions",
  templateUrl: "tweet-actions.html"
})
export class TweetActionsComponent {
  @Input()
  data: any[];
  privateFavoriteCount: number = 0;

  constructor(
    private twitter: TwitterApiProvider,
    private ref: ChangeDetectorRef,
    private navCtrl: NavController,
    private gun: P2pDatabaseGunProvider,
    private vibration: Vibration
  ) {}

  ngOnInit() {
    this.getPrivateLikes(this.id);
  }

  get favoriteCount() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["favorite_count"];
    } else {
      return this.data["favorite_count"];
    }
  }

  get id() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["id_str"];
    } else {
      return this.data["id_str"];
    }
  }

  private async getPrivateLikes(id: string) {
    const likeEntry = await this.gun.getLikes(this.id);
    if (likeEntry.likes > 0) {
      this.privateFavoriteCount = likeEntry.likes;
      this.ref.detectChanges();
    }
  }

  addPrivateLike(id: string) {
    this.vibration.vibrate([100, 50, 100]);
    this.gun.addLike(id).then(() => {
      this.privateFavoriteCount++;
      this.ref.detectChanges();
    });
  }

  toggleLike(id: string) {
    this.vibration.vibrate([100, 50, 100]);
    if (this.data["favorited"]) {
      this.removeLike(id);
    } else {
      this.like(id);
    }
  }

  private like(id: string): void {
    this.twitter.likeTweet(id).then(() => {
      this.data["favorited"] = true;
      this.data["favorite_count"]++;
      this.ref.detectChanges();
    });
  }

  private removeLike(id: string): void {
    this.twitter.unlikeTweet(id).then(() => {
      this.data["favorited"] = false;
      this.data["favorite_count"]--;
      this.ref.detectChanges();
    });
  }

  retweetStatus(id: string): void {
    this.navCtrl.push(WriteTweetPage, { tweetId: id });
  }

  replyToStatus(id: string): void {
    this.navCtrl.push(WriteTweetPage, { replyToStatus: id });
  }
}
