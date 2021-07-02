import { Component, Input } from "@angular/core";
import twittertext from "twitter-text";
import { PhotoViewer } from "@ionic-native/photo-viewer";

@Component({
  selector: "tweet-body",
  templateUrl: "tweet-body.html"
})
export class TweetBodyComponent {
  @Input()
  data: any[];

  constructor(private photoViewer: PhotoViewer) {}

  get full_text(): string {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["full_text"];
    } else {
      return this.data["full_text"];
    }
  }

  get entities() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["entities"];
    } else {
      return this.data["entities"];
    }
  }

  get extended_entities() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["extended_entities"];
    } else {
      return this.data["extended_entities"];
    }
  }
  get range() {
    if (this.data["retweeted_status"]) {
      return this.data["retweeted_status"]["display_text_range"];
    } else {
      return this.data["display_text_range"];
    }
  }

  get hasPhoto() {
    return (
      !this.data["private_tweet"] &&
      !this.isGif &&
      (this.entities["media"] && this.entities["media"][0]["type"] == "photo")
    );
  }

  get isGif() {
    return (
      !this.data["private_tweet"] &&
      this.extended_entities &&
      this.extended_entities["media"] &&
      this.extended_entities["media"][0]["type"] === "animated_gif"
    );
  }

  get status() {
    // Cut off beginning
    let status = this.full_text.substring(this.range[0]);

    // Cut off end (URLs)
    this.urlsToRemoveFromStatus().forEach(
      url => (status = status.replace(url, ""))
    );

    return status.trim();
  }

  get tweetArray() {
    const extractedEntites = twittertext.extractEntitiesWithIndices(
      this.status
    );

    let tweetArray = [];
    tweetArray = tweetArray.concat(
      this.getHashtagsForTweetArray(
        extractedEntites.filter(element => element["hashtag"])
      )
    );
    tweetArray = tweetArray.concat(
      this.getMentionsForTweetArray(
        extractedEntites.filter(element => element["screenName"])
      )
    );
    tweetArray = tweetArray.concat(
      this.getUrlsForTweetArray(
        extractedEntites.filter(element => element["url"])
      )
    );
    tweetArray = tweetArray.concat(this.getTextParts(tweetArray));

    return tweetArray.sort((a, b) => a["start"] - b["start"]);
  }

  private urlsToRemoveFromStatus(): string[] {
    const res = [];

    if (this.data["quoted_status_permalink"]) {
      res.push(this.data["quoted_status_permalink"]["url"]);
    }

    if (this.extended_entities) {
      this.extended_entities["media"].forEach(element => {
        res.push(element["url"]);
      });
    }
    return res.filter(entry => entry.length);
  }

  private getHashtagsForTweetArray(hashtags) {
    const res = [];
    hashtags.forEach(element => {
      res.push({
        start: element.indices[0],
        stop: element.indices[1],
        type: "hashtag",
        text: "#" + element["hashtag"]
      });
    });
    return res;
  }

  private getMentionsForTweetArray(mentions) {
    const res = [];
    mentions.forEach(element => {
      const apiEntity = this.entities.user_mentions.filter(
        el =>
          el.screen_name.toLowerCase() === element["screenName"].toLowerCase()
      )[0];
      if (apiEntity) {
        res.push({
          start: element.indices[0],
          stop: element.indices[1],
          type: "user_mention",
          text: "@" + element["screenName"],
          userId: apiEntity["id_str"]
        });
      }
    });
    return res;
  }

  private getUrlsForTweetArray(urls) {
    const res = [];
    urls.forEach(element => {
      const apiEntity = this.entities.urls.filter(
        el => el.url.toLowerCase() === element["url"].toLowerCase()
      )[0];
      res.push({
        start: element.indices[0],
        stop: element.indices[1],
        type: "url",
        url: element["url"],
        text: apiEntity["display_url"] || element["url"]
      });
    });
    return res;
  }

  private getTextParts(tweetArray) {
    const sortedTweetArray = tweetArray.sort((a, b) => a["start"] - b["start"]);

    const textParts = [];

    let prevEnd = 0;
    for (let i = 0; i < sortedTweetArray.length; i++) {
      if (sortedTweetArray[i]["start"] !== prevEnd) {
        const text = this.status.substring(
          prevEnd,
          sortedTweetArray[i]["start"]
        );

        textParts.push({
          start: prevEnd,
          stop: sortedTweetArray[i]["start"],
          type: "text",
          text: text
        });
      }
      prevEnd = sortedTweetArray[i]["stop"];
    }

    if (prevEnd != this.status.length) {
      textParts.push({
        start: prevEnd,
        stop: this.status.length,
        type: "text",
        text: this.status.substring(prevEnd, this.status.length)
      });
    }

    return textParts;
  }

  showPhoto(url: string) {
    this.photoViewer.show(url, null, { share: true });
  }
}
