import { Component, Input } from "@angular/core";

/**
 * Generated class for the TweetComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: "tweet",
  templateUrl: "tweet.html"
})
export class TweetComponent {
  @Input()
  data: any[];

  constructor() {}

  get user() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["user"];
    } else {
      return this.data["user"];
    }
  }

  get createdAt() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["created_at"];
    } else {
      return this.data["created_at"];
    }
  }
}
