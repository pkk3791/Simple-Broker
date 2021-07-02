import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  MenuController,
  InfiniteScroll,
  AlertController,
  Refresher,
  LoadingController
} from "ionic-angular";
import { WriteTweetPage } from "../write-tweet/write-tweet";
import { FeedProvider } from "../../providers/feed/feed";

@IonicPage()
@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  menuController: MenuController;
  tweets;
  cachedTweets=[];
  privateTweet:boolean = false;
  public color = 'primary';

  constructor(
    public navCtrl: NavController,
    private menuCtrl: MenuController,
    private feed: FeedProvider,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ionViewDidLoad() {
    this.menuCtrl.enable(true, "sideNav");
  }

  ionViewDidEnter() {
    const alertText = {
      title: "Loading tweets failed",
      subTitle: "Please try again.",
      buttons: ["OK"]
    };

    const loading = this.loadingCtrl.create();
    loading.present();

    this.feed
      .loadHomeTimeline()
      .then(tweets => {
          this.tweets=[];
          Object.assign(this.tweets, tweets);
         })
      .catch(err => {
        console.error("err is:", err);
        alertText.subTitle = err.message;
        this.alertCtrl.create(alertText).present()
      })
      .then(() => loading.dismiss());
     
  }

  doRefresh(refresher: Refresher) {
    this.feed.loadHomeTimeline().then(tweets => {
      this.tweets = tweets;
      refresher.complete();
    });
  }

  loadMore(infiniteScroll: InfiniteScroll) {
    this.feed
      .loadHomeTimeline(this.oldestPublicTweet, this.oldestPrivateTweet)
      .then(tweets => {
        this.tweets = this.tweets.concat(tweets);
        infiniteScroll.complete();
      });
  }

  writeTweet() {
    this.navCtrl.push(WriteTweetPage);
  }

  get publicTweets() {
    return this.tweets.filter(tweet => !tweet.private_tweet);
  }

  get privateTweets() {
    Object.assign(this.cachedTweets ,this.tweets);
    return this.tweets.filter(tweet => tweet.private_tweet);
  }

  get oldestPublicTweet() {
    if (this.publicTweets.length > 0) {
      return this.publicTweets.reduce((acc, cur) =>
        acc.id < cur.id ? acc : cur
      );
    } else {
      return undefined;
    }
  }

  get oldestPrivateTweet() {
    if (this.privateTweets.length > 0) {
      return this.privateTweets.reduce((acc, cur) =>
        new Date(acc.created_at) < new Date(cur.created_at) ? acc : cur
      );
    } else {
      return undefined;
    }
  }

  privateTweetOnly(){
    this.privateTweet = !this.privateTweet;
    const loading = this.loadingCtrl.create();
    loading.present();
   
    if(this.privateTweet){
      this.color = 'black';
      this.tweets = this.privateTweets;
      loading.dismiss();
    }

    else{
      this.color = 'white';
      this.tweets = this.cachedTweets;
      loading.dismiss();
    }
    
  }


}