import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { SearchResultsTweetsRecentPage } from "../search-results-tweets-recent/search-results-tweets-recent";
import { SearchResultsTweetsPopularPage } from "../search-results-tweets-popular/search-results-tweets-popular";

@IonicPage()
@Component({
  selector: "page-search-results-tweets-tabs",
  templateUrl: "search-results-tweets-tabs.html"
})
export class SearchResultsTweetsTabsPage {
  searchResultsRecentTweets = SearchResultsTweetsRecentPage;
  searchResultsPopularTweets = SearchResultsTweetsPopularPage;
  query: string;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.query = this.navParams.data;
  }

  ionViewDidLoad() {}
}
