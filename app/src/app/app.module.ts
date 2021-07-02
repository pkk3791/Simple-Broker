import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular";
import { SplashScreen } from "@ionic-native/splash-screen";
import { StatusBar } from "@ionic-native/status-bar";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { IonicStorageModule } from "@ionic/storage";
import { SocialSharing } from "@ionic-native/social-sharing";
import { PhotoViewer } from "@ionic-native/photo-viewer";
import { Vibration } from "@ionic-native/vibration";

import { AuthProvider } from "../providers/auth/auth";

import { MyApp } from "./app.component";
import { HomePage } from "../pages/home/home";
import { SearchPage } from "../pages/search/search";
import { SettingsPage } from "../pages/settings/settings";
import { LoginPage } from "../pages/login/login";
import { TwitterApiProvider } from "../providers/twitter-api/twitter-api";
import { FeedComponent } from "../components/feed/feed";
import { TweetComponent } from "../components/tweet/tweet";
import { TweetHeaderComponent } from "../components/tweet-header/tweet-header";
import { TweetBodyComponent } from "../components/tweet-body/tweet-body";
import { TweetActionsComponent } from "../components/tweet-actions/tweet-actions";
import { ProfilePage } from "../pages/profile/profile";
import { ProfileHeaderComponent } from "../components/profile-header/profile-header";
import { PipesModule } from "../pipes/pipes.module";
import { WriteTweetPage } from "../pages/write-tweet/write-tweet";
import { QuotedStatusComponent } from "../components/quoted-status/quoted-status";
import { P2pStorageIpfsProvider } from "../providers/p2p-storage-ipfs/p2p-storage-ipfs";
import { P2pDatabaseGunProvider } from "../providers/p2p-database-gun/p2p-database-gun";
import { PgpKeyServerProvider } from "../providers/pgp-key-server/pgp-key-server";
import { FeedProvider } from "../providers/feed/feed";
import { MentionComponent } from "../components/mention/mention";
import { HashtagComponent } from "../components/hashtag/hashtag";
import { SearchResultsUsersPage } from "../pages/search-results-users/search-results-users";
import { SearchResultsTweetsPopularPage } from "../pages/search-results-tweets-popular/search-results-tweets-popular";
import { SearchResultsTweetsRecentPage } from "../pages/search-results-tweets-recent/search-results-tweets-recent";
import { SearchResultsTweetsTabsPage } from "../pages/search-results-tweets-tabs/search-results-tweets-tabs";
import { AboutPage } from "../pages/about/about";
import { CryptoProvider } from "../providers/crypto/crypto";

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    SearchPage,
    SettingsPage,
    LoginPage,
    ProfilePage,
    WriteTweetPage,
    SearchResultsTweetsTabsPage,
    SearchResultsTweetsRecentPage,
    SearchResultsTweetsPopularPage,
    SearchResultsUsersPage,
    AboutPage,
    FeedComponent,
    TweetComponent,
    TweetHeaderComponent,
    TweetBodyComponent,
    TweetActionsComponent,
    ProfileHeaderComponent,
    QuotedStatusComponent,
    MentionComponent,
    HashtagComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    PipesModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    SearchPage,
    SettingsPage,
    LoginPage,
    ProfilePage,
    WriteTweetPage,
    SearchResultsTweetsTabsPage,
    SearchResultsTweetsRecentPage,
    SearchResultsTweetsPopularPage,
    SearchResultsUsersPage,
    AboutPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    HttpClient,
    SocialSharing,
    PhotoViewer,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    AuthProvider,
    TwitterApiProvider,
    P2pStorageIpfsProvider,
    P2pDatabaseGunProvider,
    PgpKeyServerProvider,
    FeedProvider,
    CryptoProvider,
    Vibration
  ]
})
export class AppModule {}
