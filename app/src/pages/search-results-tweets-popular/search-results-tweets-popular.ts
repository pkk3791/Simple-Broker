import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  InfiniteScroll,
  Events
} from "ionic-angular";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";

@IonicPage()
@Component({
  selector: "page-search-results-tweets-popular",
  templateUrl: "search-results-tweets-popular.html"
})
export class SearchResultsTweetsPopularPage {
  query: string;
  tweets = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private twitter: TwitterApiProvider,
    private events: Events
  ) {
    this.query = this.navParams.data;

    this.events.subscribe("query:changed", query => {
      if (query.length) {
        this.twitter
          .searchPopularTweets(query)
          .then(res => (this.tweets = res));
        this.query = query;
      }
    });
  }

  async ionViewDidLoad() {
    if (this.query.length) {
      this.tweets = await this.twitter.searchPopularTweets(this.query);
    }
  }

  doRefresh(refresher: Refresher) {
    this.twitter.searchPopularTweets(this.query).then(tweets => {
      this.tweets = tweets;
      refresher.complete();
    });
  }

  loadMore(infiniteScroll: InfiniteScroll) {
    this.twitter
      .searchPopularTweets(this.query, this.oldestTweet)
      .then(tweets => {
        this.tweets["statuses"] = this.tweets["statuses"].concat(
          tweets["statuses"]
        );
        infiniteScroll.complete();
      });
  }

  get oldestTweet() {
    if (this.tweets.length > 0) {
      return this.tweets.reduce((acc, cur) => (acc.id < cur.id ? acc : cur))[
        "id_str"
      ];
    } else {
      return undefined;
    }
  }

  get enableRefresh() {
    return this.query.length > 0;
  }

  get enableInfiniteScroll() {
    return this.query.length > 0;
  }
}
