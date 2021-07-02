import { Component, ViewChild } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  InfiniteScroll,
  Content,
  LoadingController
} from "ionic-angular";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";
import { FeedProvider } from "../../providers/feed/feed";

@IonicPage()
@Component({
  selector: "page-profile",
  templateUrl: "profile.html"
})
export class ProfilePage {
  user: any = [];
  tweets: any[];
  oldestLoadedTweetId;
  enableRefresh: boolean = true;
  enableInfiniteScroll: boolean = true;

  @ViewChild(Content)
  content: Content;

  constructor(
    public navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private navParams: NavParams,
    private twitter: TwitterApiProvider,
    private feed: FeedProvider
  ) {}

  ionViewDidLoad() {
    // Show loading indicator
    const loading = this.loadingCtrl.create();
    loading.present();

    // Read user id
    const userId = this.navParams.get("userId");

    // Fetch user details from Twitter
    this.twitter.fetchUser(userId).then(res => (this.user = res));

    // Load user's timeline from Twitter and P2P
    this.feed.loadUserTimeline(userId).then(res => {
      if (res.length > 0) {
        // Store tweets
        this.tweets = res;
      } else {
        this.enableInfiniteScroll = false;
      }
      // Hide loading indicator
      loading.dismiss();
    });
  }

  doRefresh(refresher) {
    this.feed.loadUserTimeline(this.user.id_str).then(res => {
      if (res.length > 0) {
        // Replace tweets
        this.tweets = res;
      }

      // Hide loading icon
      refresher.complete();
    });
  }

  loadMore(infiniteScroll: InfiniteScroll) {
    if (this.enableInfiniteScroll) {
      this.feed
        .loadUserTimeline(
          this.user.id_str,
          this.oldestPublicTweet,
          this.oldestPrivateTweet
        )
        .then(res => {
          if (res.length > 0) {
            // Append loaded tweets
            this.tweets = this.tweets.concat(res);
          } else {
            this.enableInfiniteScroll = false;
          }
          // Hide loading icon
          infiniteScroll.complete();
        });
    } else {
      // Hide loading icon
      infiniteScroll.complete();
    }
  }

  get publicTweets() {
    return this.tweets.filter(tweet => !tweet.private_tweet);
  }

  get privateTweets() {
    return this.tweets.filter(tweet => tweet.private_tweet);
  }

  get oldestPublicTweet() {
    if (this.publicTweets.length > 0) {
      return this.publicTweets.reduce(
        (acc, cur) => (acc.id < cur.id ? acc : cur)
      );
    } else {
      return undefined;
    }
  }

  get oldestPrivateTweet() {
    if (this.privateTweets.length > 0) {
      return this.privateTweets.reduce(
        (acc, cur) =>
          new Date(acc.created_at) < new Date(cur.created_at) ? acc : cur
      );
    } else {
      return undefined;
    }
  }

  onScroll(event) {
    this.enableRefresh = event.scrollTop === 0;
  }
}
