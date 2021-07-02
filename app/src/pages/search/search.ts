import { Component } from "@angular/core";
import { NavController, NavParams, Events } from "ionic-angular";
import { SearchResultsUsersPage } from "../search-results-users/search-results-users";
import { SearchResultsTweetsTabsPage } from "../search-results-tweets-tabs/search-results-tweets-tabs";

@Component({
  selector: "page-search",
  templateUrl: "search.html"
})
export class SearchPage {
  searchResultsTweets = SearchResultsTweetsTabsPage;
  searchResultsUsers = SearchResultsUsersPage;
  query: string;

  constructor(
    public navCtrl: NavController,
    private navParams: NavParams,
    private events: Events
  ) {
    this.query = this.navParams.get("query");
  }

  onInput() {
    this.events.publish("query:changed", this.query.trim());
  }
}
