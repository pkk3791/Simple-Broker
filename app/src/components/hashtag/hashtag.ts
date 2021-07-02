import { Component, Input } from "@angular/core";
import { App } from "ionic-angular";
import { SearchPage } from "../../pages/search/search";

@Component({
  selector: "hashtag",
  templateUrl: "hashtag.html"
})
export class HashtagComponent {
  @Input()
  hashtag;

  constructor(private appCtrl: App) {}

  search(hashtag) {
    this.appCtrl.getRootNav().push(SearchPage, { query: hashtag });
  }
}
