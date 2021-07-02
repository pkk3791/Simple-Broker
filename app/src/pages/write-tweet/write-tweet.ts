import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  LoadingController,
  AlertController
} from "ionic-angular";
import {
  FormBuilder,
  Validators,
  FormGroup,
  ValidatorFn,
  AbstractControl
} from "@angular/forms";
import { TwitterApiProvider } from "../../providers/twitter-api/twitter-api";
import { Storage } from "@ionic/storage";
import { P2pStorageIpfsProvider } from "../../providers/p2p-storage-ipfs/p2p-storage-ipfs";
import { P2pDatabaseGunProvider } from "../../providers/p2p-database-gun/p2p-database-gun";
import { PgpKeyServerProvider } from "../../providers/pgp-key-server/pgp-key-server";
import twittertext from "twitter-text";
import { CryptoProvider } from "../../providers/crypto/crypto";
import * as openpgp from 'openpgp';

@IonicPage()
@Component({
  selector: "page-write-tweet",
  templateUrl: "write-tweet.html"
})
export class WriteTweetPage {
  tweet: FormGroup;
  retweetId: string;
  replyToStatusId: string;
  retweet;
  replyTweet;
  openpgp;
  privateKey;
  publicKey;
  pk: any[] = [];
  passp = 'super long and hard to guess secret';
  hkp = new openpgp.HKP('https://sks-keyservers.net/');


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private formBuilder: FormBuilder,
    private twitter: TwitterApiProvider,
    private loadingCtrl: LoadingController,
    private storage: Storage,
    private ipfs: P2pStorageIpfsProvider,
    private gun: P2pDatabaseGunProvider,
    private cryptoUtils: CryptoProvider,
    private opnpgp: PgpKeyServerProvider,
    private alertCtrl: AlertController
  ) {
    this.retweetId = this.navParams.get("tweetId");
    this.replyToStatusId = this.navParams.get("replyToStatus");

    this.tweet = this.formBuilder.group({
      text: [""],
      p2p: [false]
    });

    this.addValidators();
   }

  private async addValidators() {
    const triggerWords = await this.storage.get("keywords");
    const validators = [
      Validators.maxLength(140),
      this.containsTriggerWord(triggerWords)
    ];
    this.tweet.controls["text"].setValidators(validators);
  }

  private containsTriggerWord(triggerWords: string): ValidatorFn {
    return (control: AbstractControl): {
      [key: string]: any
    } | null => {
      if (triggerWords) {
        const regexList = triggerWords
          .toLowerCase()
          .split(", ")
          .join("|");
        const regex = new RegExp(regexList);
        const containsTriggerWord = regex.test(control.value.toLowerCase());
        return containsTriggerWord ? { containsTriggerWord: { value: control.value } } :
          null;
      } else {
        return null;
      }
    };
  }

  async ionViewDidLoad() {
    if (this.retweetId) {
      this.retweet = await this.twitter.fetchTweet(this.retweetId);
    }
    if (this.replyToStatusId) {
      this.replyTweet = await this.twitter.fetchTweet(this.replyToStatusId);
    }
  }

  get tweetCharProgress() {
    const progress = 1 - this.tweet.value["text"].length / 140;
    const radius = 8;
    const circumference = Math.PI * radius * 2;
    return progress * circumference;
  }

  get showTrigger(): boolean {
    return (
      this.tweet &&
      this.tweet.controls &&
      this.tweet.controls.text &&
      this.tweet.controls.text.errors &&
      this.tweet.controls.text.errors["containsTriggerWord"] &&
      !this.tweet.controls.p2p.value
    );
  }

  showTriggerInfo() {
    this.alertCtrl
      .create({
        title: "Watch Out!",
        message: "Your tweet contains words you have previously defined to only share securely via P2P. Currently P2P mode is not selected.",
        buttons: ["OK"]
      })
      .present();
  }

  async submitTweet() {
    const loading = this.loadingCtrl.create();
    loading.present();

    if (this.tweet.value.p2p) {
      loading.setContent("Validate keys...");
      if (
        (await this.cryptoUtils.isPrivateKeySet()) &&
        (await this.cryptoUtils.isPublicKeyPublished())
      ) {
        loading.setContent("Publish private tweet...");
        await this.tweetPrivate();
      } else {
        loading.dismiss();
        const alert = this.alertCtrl.create({
          title: "Oooops...",
          message: "Please verify that you have set a private and public key in the settings and that your latest public key was published."
        });
        alert.present();
        return;
      }
    } else {
      loading.setContent("Publish on Twitter...");
      await this.twitter.tweet(
        this.tweet.value["text"],
        this.retweet,
        this.replyToStatusId
      );
    }

    loading.dismiss();
    this.navCtrl.pop();
  }

  private async tweetPrivate() {
    const tweet = await this.buildPrivateTweet();
    const privateKey = await this.storage.get("privateKey");
    //encrypting for self
    let email = await this.storage.get("email");
    await this.opnpgp.lookupKeys(email);
    //encrypt the tweet with multiple keys
    let encryptedTweet = await this.opnpgp.encrypt(JSON.stringify(tweet));

    await this.storeIPFS(encryptedTweet, tweet)
    return encryptedTweet;
  }

  private async storeIPFS(result, tweet){

    const res = await this.ipfs.storeTweet(result);
    await this.gun.storeLastTweetHashForUser(
      tweet.user_id,
      res["Hash"],
      tweet.created_at
    );

    await this.gun.publishHashtags(tweet.entities.hashtags);
  }

  private async buildPrivateTweet() {
    const status = this.tweet.value["text"].trim();
    const entities = await this.getEntities(status);

    return {
      full_text: status,
      user_id: await this.storage.get("userId"),
      created_at: Date.now(),
      private_tweet: true,
      in_reply_to_status_id: this.replyToStatusId,
      quoted_status_id: this.retweetId,
      display_text_range: [0, status.length],
      entities: entities
    };
  }

  private async getEntities(status: string) {
    return {
      hashtags: twittertext.extractHashtagsWithIndices(status),
      urls: twittertext.extractUrlsWithIndices(status),
      user_mentions: await this.getMentions(status)
    };
  }

  private async getMentions(status: string) {
    // extract mentions
    const entities = twittertext.extractMentionsWithIndices(status);

    // add user_id
    const entitiesWithPromises = entities.map(async mention => {
      try {
        const user = await this.twitter.fetchUserFromScreenName(
          mention.screenName
        );
        mention["id_str"] = user[0]["id_str"];
        mention["screen_name"] = mention.screenName;
        delete mention.screenName;
      } catch (err) {
        console.error(
          "There is no user signed up to twitter with username: " +
          mention.screenName
        );
      }
      return mention;
    });

    // filter for valid users and return
    return (await Promise.all(entitiesWithPromises)).filter(el =>
      el.hasOwnProperty("id_str")
    );
  }
}
