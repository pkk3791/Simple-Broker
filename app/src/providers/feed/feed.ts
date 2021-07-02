import { Injectable } from "@angular/core";
import { TwitterApiProvider } from "../twitter-api/twitter-api";
import { P2pDatabaseGunProvider } from "../p2p-database-gun/p2p-database-gun";
import { P2pStorageIpfsProvider } from "../p2p-storage-ipfs/p2p-storage-ipfs";
import { CryptoProvider } from "../crypto/crypto";
import { PgpKeyServerProvider } from "../../providers/pgp-key-server/pgp-key-server";
import { Storage } from "@ionic/storage";
@Injectable()
export class FeedProvider {
  friends;
  userId: string;

  constructor(
    private twitter: TwitterApiProvider,
    private gun: P2pDatabaseGunProvider,
    private ipfs: P2pStorageIpfsProvider,
    private cryptoUtils: CryptoProvider,
    private opnpgp: PgpKeyServerProvider,
    private storage: Storage
  ) {
    this.storage.get("userId").then(userId => (this.userId = userId));
  }

  /**
   * Retrives the public and private tweets for a user
   * Since it is loaded in batches of 20 public tweets, public and private tweet are used as reference to load next 20 tweets
   * @param userId user id
   * @param oldestPublicTweet oldest public tweet
   * @param oldestPrivateTweet oldest private tweet
   */
  public async loadUserTimeline(
    userId,
    oldestPublicTweet ? ,
    oldestPrivateTweet ?
  ) {
    const maxId = oldestPublicTweet ? oldestPublicTweet["id_str"] : undefined;
    // Fetch tweets from Twitter
    let tweets = await this.twitter.fetchUserTimeline(userId, maxId);
    if (tweets.length === 0) return tweets;
    tweets = tweets.filter(tweet => tweet.id_str != maxId);

    // Determine start and end of time interval to look for private tweets
    const intervalStart: Date = oldestPrivateTweet ?
      new Date(oldestPrivateTweet["created_at"]) :
      new Date();
    const intervalEnd: Date = this.getOldestTweetTimestamp(tweets);

    const privateTweets = await this.fetchUserPrivateTweets(userId,intervalStart,intervalEnd);
      // Combine and sort tweets
    if(privateTweets){
      return tweets
        .concat(privateTweets)
        .sort((a, b) => this.sortByDateAsc(a, b));
    } else {
      return tweets;
    }
  }

  /**
   * Retrieves the home feed for the logged in user
   * Since it is loaded in batches of 20 public tweets, public and private tweet are used as reference to load next 20 tweets
   * @param oldestPublicTweet oldest public tweet
   * @param oldestPrivateTweet oldest private tweet
   */
  public async loadHomeTimeline(oldestPublicTweet ? , oldestPrivateTweet ? ) {
    // Fetch tweets from Twitter
    await this.storage.get("userId").then(userId => (this.userId = userId));
    // console.log("loading hometimeline for userId:",this.userId);
    const maxId = oldestPublicTweet ? oldestPublicTweet["id_str"] : undefined;
    let tweets = await this.twitter.fetchHomeFeed(maxId);
    tweets = tweets.filter(tweet => tweet.id_str != maxId);
    // Determine start and end of time interval to look for private tweets
    const intervalStart: Date = oldestPrivateTweet ?
      new Date(oldestPrivateTweet["created_at"]) :
      new Date();
    const intervalEnd: Date = this.getOldestTweetTimestamp(tweets);

    // Fetch user's friends
    const friends = await this.getCachedFriends(this.userId);

    // Extract friends user ids and add own user id
    const friendsAndUserIds = friends
      .map(friend => friend.id_str)
      .concat([this.userId]);
      // console.log("friendsAndUserIds are:"+friendsAndUserIds);

    // Fetch ipfs hashs for period
    const promises: Promise < object[] > [] = friendsAndUserIds.map(accountId => {
      return this.gun.fetchPrivateTweetHashsForUserInInterval(
        accountId,
        intervalStart,
        intervalEnd
      );
    });

    //save pubkey of all fetchFollowersPublicKeys
    await this.fetchFollowersPublicKeys(friendsAndUserIds);

    const resolvedPromises = await Promise.all(promises);
    const privateTweetHashs = resolvedPromises.reduce(
      (privateTweets, el) => privateTweets.concat(el),
      []
    );

    if (privateTweetHashs.length > 0) {
      const privateTweets = await this.fetchPrivateTweets(privateTweetHashs);
    
      return tweets
        .concat(privateTweets)
        .sort((a, b) => this.sortByDateAsc(a, b));

    } else {
      return tweets;
    }
  }

  private async fetchUserPrivateTweets(userId,intervalStart,intervalEnd){
    // Fetch private tweet hashs from P2P DB for corresponding interval
    const privateTweetHashs: object[] = await this.gun.fetchPrivateTweetHashsForUserInInterval(
      userId,
      intervalStart,
      intervalEnd
    );

    if (privateTweetHashs.length > 0) {
     return this.fetchPrivateTweets(privateTweetHashs);
   }
   return null;
  }

  private async fetchFollowersPublicKeys(followers) {
    //Fetch email address of all friends from gunDB
    const emailPromises: Promise < string > [] = followers.map(accountId => {
      return this.gun.getEmail(
        accountId
      );
    });

    const resolvedPromises = await Promise.all(emailPromises);
    for (let i = 0; i < resolvedPromises.length; i++) {
      if (resolvedPromises[i]) {
        let email = resolvedPromises[i]["email"];
        // console.log("email is:",email);
        if(email){
         this.opnpgp.lookupKeys(email);
        }
      }

    }
  }


  private async fetchPrivateTweets(privateTweetsData: object[]) {
    // console.log('error in console fetch private tweets');
    const privateTweets = [];

    // Load private tweets from P2P storage
    // console.log("privateTweetsData.length",privateTweetsData.length);
    for (let i = 0; i < privateTweetsData.length; i++) {
      let pvtKeyTimestamped;

      const hash = privateTweetsData[i]["hash"];
      const userId = privateTweetsData[i]["userId"];
      const timestamp = privateTweetsData[i]["created_at"];

      // fetch from IPFS
      const encryptedTweet = await this.ipfs.fetchTweet(hash);

      if (!encryptedTweet) {
        return;
      }

      // Fetch private key history for user
      try {
        const privateKeyHistory: object[] = await this.cryptoUtils.fetchPrivateKeyHistoryForUser(
          userId
        );

        pvtKeyTimestamped = await  this.getPrivateKeyAt(timestamp,privateKeyHistory);
        console.log("private key valid for ", timestamp, "is:",pvtKeyTimestamped);

        if(pvtKeyTimestamped){
           let armrdpvtkey = await this.opnpgp.getArmoredPrivateKey(pvtKeyTimestamped);
          console.log("decrypted private key is:",armrdpvtkey);

          const decryptedTweet = await this.opnpgp.decrypt(encryptedTweet, armrdpvtkey);
          console.log("decryptedTweet:",decryptedTweet)
          if (decryptedTweet)
            privateTweets.push(JSON.parse(decryptedTweet));
        }
      } catch (err) {
        console.log("Error caught in feed",err);
      }

      // let pvtKey = await this.storage.get("privateKey");
    }
    if (privateTweets.length > 0) {
      // Add retweeted/quoted status
      privateTweets.map(async tweet => await this.addQuotedStatusToTweet(tweet));

      // Add original status (reply to)
      privateTweets.map(
        async tweet => await this.addOriginalStatusToTweet(tweet)
      );

      // Add user object to private tweets
      return await Promise.all(
        privateTweets.map(async tweet => await this.addUserToTweet(tweet))
      );
    }

    return privateTweets;

  }

  private async addUserToTweet(tweet: object): Promise < object > {
    tweet["user"] = await this.twitter.fetchUser(tweet["user_id"]);
    return tweet;
  }

  private async addQuotedStatusToTweet(tweet: object): Promise < object > {
    if (!tweet["quoted_status_id"]) return tweet;
    const quoted_status = await this.twitter.fetchTweet(
      tweet["quoted_status_id"]
    );
    tweet["quoted_status"] = quoted_status["data"];
    return tweet;
  }

  private async addOriginalStatusToTweet(tweet: object): Promise < object > {
    if (!tweet["in_reply_to_status_id"]) return tweet;
    const originalTweet = await this.twitter.fetchTweet(
      tweet["in_reply_to_status_id"]
    );
    tweet["in_reply_to_screen_name"] =
    originalTweet["data"]["user"]["screen_name"];
    return tweet;
  }

  private getOldestTweetTimestamp(tweets): Date {
    if (tweets.length < 15) {
      // End of timeline is reached - load all private tweets
      return new Date("2018-04-01T00:00:00");
    } else {
      const lastTweetTimestamp = tweets[tweets.length - 1].created_at;
      return new Date(lastTweetTimestamp);
    }
  }

  private sortByDateAsc(a, b) {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    if (dateA > dateB) {
      return -1;
    } else if (dateA < dateB) {
      return 1;
    } else {
      return 0;
    }
  }

  private async getCachedFriends(userId) {
    // Cache friends for 15 minutes to avoid unnecessary  API calls
    if (!this.friends || (Date.now() - this.friends.lastUpdate) / 900000 > 15) {
      this.friends = {
        friendList: await this.twitter.fetchFriends(userId),
        lastUpdate: Date.now()
      };
    }
    return this.friends.friendList;
  }

  private async getPrivateKeyAt(
    timestamp: string,
    privateKeyHistory: object[]
  ) {
    if(!privateKeyHistory) return await this.storage.get("privateKey") ;
    const timestampTweet = new Date(timestamp).getTime();
    for (let key of privateKeyHistory) {
      const timestampKey = new Date(key["validFrom"]).getTime();
      if (timestampTweet > timestampKey) {
        return key["key"];
      }
    }
    // todo: throw error
    return null;
  }
}
