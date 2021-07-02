import { NgModule } from "@angular/core";
import { FeedComponent } from "./feed/feed";
import { TweetComponent } from "./tweet/tweet";
import { TweetHeaderComponent } from "./tweet-header/tweet-header";
import { TweetBodyComponent } from "./tweet-body/tweet-body";
import { TweetActionsComponent } from "./tweet-actions/tweet-actions";
import { ProfileHeaderComponent } from "./profile-header/profile-header";
import { QuotedStatusComponent } from "./quoted-status/quoted-status";
import { HashtagComponent } from "./hashtag/hashtag";
import { MentionComponent } from "./mention/mention";
@NgModule({
  declarations: [
    FeedComponent,
    TweetComponent,
    TweetHeaderComponent,
    TweetBodyComponent,
    TweetActionsComponent,
    ProfileHeaderComponent,
    QuotedStatusComponent,
    HashtagComponent,
    MentionComponent
  ],
  imports: [],
  exports: [
    FeedComponent,
    TweetComponent,
    TweetHeaderComponent,
    TweetBodyComponent,
    TweetActionsComponent,
    ProfileHeaderComponent,
    QuotedStatusComponent,
    HashtagComponent,
    MentionComponent
  ]
})
export class ComponentsModule {}
