import { Injectable } from "@angular/core";
import Gun from "gun/gun";
import "gun/lib/then";

@Injectable()
export class P2pDatabaseGunProvider {
  private gun;
  osnPrefix: string = "hybridOSN-v2.0.0";

  constructor() {
    this.gun = Gun(["https://hosn-twitter-app.herokuapp.com/gun"]);
  }

  /**
   * Hashtags are stored without reference to the users to provide these information on an extra dashboard to twitter
   * @param hashtagEntity extracted hashtags
   */
  public async publishHashtags(hashtagEntity): Promise < void > {
    const timestamp = new Date().setHours(0, 0, 1, 0);
    const hashtagsSeparated = hashtagEntity
      .map(el => el.hashtag)
      .sort()
      .join("|");

    const randomId = Math.floor(Math.random() * 10000000000);

    const hashtags = this.gun
      .get(randomId)
      .put({ hashtags: hashtagsSeparated });

    this.gun
    .get(this.osnPrefix)
    .get("hashtags")
    .get(timestamp)
    .set(hashtags);
  }

  /**
   * Store the ipfs hash to a private tweet in GUN
   * @param userId user id
   * @param hash ipfs hash
   * @param timestamp timestamp
   */
  public storeLastTweetHashForUser(userId, hash, timestamp): void {
    const tweet = this.gun
      .get(timestamp)
      .put({ hash: hash, created_at: timestamp });

    this.gun
      .get(this.osnPrefix)
      .get("tweets")
      .get(userId)
      .set(tweet);
  }

  /**
   * Retrieves the ipfs hashes of private tweets for a user in the given time interval
   * @param userId user id
   * @param intervalStart interval start timestamp
   * @param intervalEnd interval end timestamp
   */
  public async fetchPrivateTweetHashsForUserInInterval(
    userId,
    intervalStart,
    intervalEnd
  ): Promise < object[] > {
    const privateTweets = await this.gun
      .get(this.osnPrefix)
      .get("tweets")
      .get(userId)
      .then();

    if (privateTweets) {
      const entries = await Promise.all(
        Object.keys(privateTweets)
        .filter(key => key !== "_")
        .map(key => this.gun.get(key).then())
      );

      return entries
        .filter(entry => {
          if (entry) {
            const createdAtDate = new Date(entry["created_at"]);
            return createdAtDate < intervalStart && createdAtDate >= intervalEnd;
          }
        })
        .map(entry => {
          entry.userId = userId;
          return entry;
        });

    } else {
      return [];
    }
  }

  /**
   * Adds a like to a tweet privately
   * @param tweetId tweet id
   */
  public async addLike(tweetId: string) {
    const likeEntry = await this.getLikes(tweetId);

    const likes = this.gun.get(tweetId).put({
      likes: likeEntry.likes + 1
    });

    this.gun
      .get(this.osnPrefix)
      .get("likes")
      .set(likes);
  }

  /**
   * Retrieves the private likes for a tweet
   * @param tweetId tweet id
   */
  public async getLikes(tweetId: string) {
    const likeEntry = await this.gun
      .get(this.osnPrefix)
      .get("likes")
      .get(tweetId)
      .then();

    if (likeEntry === undefined) {
      return {
        likes: 0
      };
    } else {
      return likeEntry;
    }
  }

  public async setEmail(userId, email) {
    const emailadd = this.gun.get(userId).put({
      email: email
    });

    this.gun
      .get(this.osnPrefix)
      .get("email")
      .set(emailadd);

  }

  public async getEmail(userId) {
    let entry = await this.gun
      .get(this.osnPrefix)
      .get("email");

    const emailEntry = await this.gun
      .get(this.osnPrefix)
      .get("email")
      .get(userId)
      .then();

    if (emailEntry === undefined) {
      return null;
    } else {
      return emailEntry;
    }
  }

  public async storePrivateKeyHistory(userId, email, ipfs) {
    const pvtKey = this.gun.get(userId).put({
      key: ipfs
    });
    console.log("pvtKey:",pvtKey);

    this.gun
      .get(this.osnPrefix)
      .get("privateKey")
      .set(pvtKey);
 
   let test = await this.getPvtKeyHistory(userId);
   console.log("test:",test);
  }

  public async getPvtKeyHistory(userId) {
    let entry = await this.gun
      .get(this.osnPrefix)
      .get("privateKey");
      console.log("entry:",entry);

    const pvtKeyEntry = await this.gun
      .get(this.osnPrefix)
      .get("privateKey")
      .get(userId)
      .then();
    if (pvtKeyEntry === undefined) {
      return null;
    } else {
      return pvtKeyEntry;
    }
  }




}
