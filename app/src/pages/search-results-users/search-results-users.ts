import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  InfiniteScroll,
  App,
  Events
} from "ionic-angular";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";
import { ProfilePage } from "../profile/profile";

@IonicPage()
@Component({
  selector: "page-search-results-users",
  templateUrl: "search-results-users.html"
})
export class SearchResultsUsersPage {
  query: string;
  nextPage: number = 2;
  users: any[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private appCtrl: App,
    private twitter: TwitterApiProvider,
    private events: Events
  ) {
    this.query = this.navParams.data;

    this.events.subscribe("query:changed", query => {
      if (query.length) {
        this.twitter.searchUsers(query).then(res => (this.users = res));
        this.query = query;
      }
    });
  }

  async ionViewDidLoad() {
    if (this.query.length) {
      this.users = await this.twitter.searchUsers(this.query);
    }
  }

  showProfile(userId) {
    this.appCtrl.getRootNav().push(ProfilePage, { userId });
    this.nextPage = 2;
  }

  doRefresh(refresher: Refresher) {
    this.twitter.searchUsers(this.query).then(users => {
      this.users = users;
      this.nextPage = 2;
      refresher.complete();
    });
  }

  loadMore(infiniteScroll: InfiniteScroll) {
    this.twitter.searchUsers(this.query, this.nextPage).then(users => {
      this.users = this.users.concat(users);
      infiniteScroll.complete();
      this.nextPage = this.nextPage + 1;
    });
  }
}
