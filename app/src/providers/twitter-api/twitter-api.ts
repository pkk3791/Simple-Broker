import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Storage } from "@ionic/storage";
import Twit from "twit";
import { PgpKeyServerProvider } from "../../providers/pgp-key-server/pgp-key-server";

@Injectable()
export class TwitterApiProvider {
  client: Twit;

  constructor(public http: HttpClient, private storage: Storage, private openpgp: PgpKeyServerProvider,) {
    this.initApi();
  }

  /**
   * initialize Twitter API provider
   */
  public async initApi() {
    const access_token_key = await this.storage.get("accessTokenKey");
    const access_token_secret = await this.storage.get("accessTokenSecret");
    if (access_token_key && access_token_secret) {
      this.client = new Twit({
        consumer_key: "ewAyFOepelB1Dgczl7LReD3pN",
        consumer_secret: "xblu59EZCTrNnW5waDvPjkpaiothQBjDCaJlLaxuezfIdol9Ot",
        access_token: access_token_key,
        access_token_secret: access_token_secret,
        timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
      });
     await  this.openpgp.clearStoredKeys();
    } else {
      console.error(
        "Access Token Key and Secret not set. Creating Twit-client not possible."
      );
      console.info("This error can be ignored if no user is logged in.");
    }
  }

  /**
   * fetch home feed in batches of 20 tweets starting at maxId
   * @param maxId tweet id
   */
  public async fetchHomeFeed(maxId ? ) {
    const res = await this.client.get("statuses/home_timeline", {
      count: 15,
      include_entities: true,
      tweet_mode: "extended",
      max_id: maxId
    })
    return res.data;
  }

  /**
   * fetch user object to given id
   * @param userId user id
   */
  public async fetchUser(userId) {
    const res = await this.client.get("users/show", { user_id: userId });
    // console.log("User is:",res.data);
    return res.data;
  }

  /**
   * lookup user for screenname
   */
  public async fetchUserFromScreenName(screenName) {
    const res = await this.client.get("users/lookup", {
      screen_name: screenName
    });
    return res.data;
  }

  /**
   * fetch user feed in batches of 20 tweets starting at maxId
   * @param userId user id
   * @param maxId max tweet id
   */
  public async fetchUserTimeline(userId, maxId ? ) {
    try {
      const res = await this.client.get("statuses/user_timeline", {
        user_id: userId,
        max_id: maxId,
        include_entities: true,
        tweet_mode: "extended",
        count: 20
      });
      return res.data;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /**
   * Follow user
   * @param userId user id
   */
  public async createFriendship(userId) {
    return await this.client.post("friendships/create", { user_id: userId });
  }

  /**
   * Unfollow user
   * @param userId user id
   */
  public async destroyFriendship(userId) {
    return await this.client.post("friendships/destroy", { user_id: userId });
  }

  /**
   * Mute user
   * @param userId user id
   */
  public async muteUser(userId) {
    return await this.client.post("mutes/users/create", { user_id: userId });
  }

  /**
   * Unmute user
   * @param userId user id
   */
  public async unmuteUser(userId) {
    return await this.client.post("mutes/users/destroy", { user_id: userId });
  }

  /**
   * Block user
   * @param userId user id
   */
  public async blockUser(userId) {
    return await this.client.post("blocks/create", { user_id: userId });
  }

  /**
   * Unblock user
   * @param userId user id
   */
  public async unblockUser(userId) {
    return await this.client.post("blocks/destroy", { user_id: userId });
  }

  /**
   * Post tweet
   * @param status tweet message
   * @param retweet tweet object to retweet
   * @param replyToStatusId tweet id to reply to
   */
  public async tweet(status, retweet ? , replyToStatusId ? ) {
    if (status.length === 0 && retweet) {
      // Simple retweet
      return await this.client.post("statuses/retweet", {
        id: retweet.data.id_str
      });
    } else if (!retweet) {
      // Simple tweet
      return await this.client.post("statuses/update", {
        status: status,
        in_reply_to_status_id: replyToStatusId
      });
    } else if (status.length > 0 && retweet) {
      // Quoted tweet
      const url =
        "https://twitter.com/" +
        retweet.data.user.screen_name +
        "/status/" +
        retweet.data.id_str;
      return await this.client.post("statuses/update", {
        status: status,
        attachment_url: url
      });
    } else {
      return;
    }
  }

  /**
   * Fetch friends for user id
   * @param userId user id
   */
  public async fetchFriends(userId) {
    let friends = [];
    let cursor = -1;

    while (cursor != 0) {
      const res = await this.client.get("friends/list", {
        user_id: userId,
        count: 200,
        include_user_entities: false,
        cursor: cursor
      });

      cursor = res.data["next_cursor"];
      friends = friends.concat(res.data["users"]);
      console.log("friends are:",friends);
    }

    return friends;
  }

  /**
   * Like tweet
   * @param tweetId tweet id
   */
  public async likeTweet(tweetId) {
    return await this.client.post("favorites/create", { id: tweetId });
  }

  /**
   * Remove like from tweet
   * @param tweetId tweet id
   */
  public async unlikeTweet(tweetId) {
    return await this.client.post("favorites/destroy", { id: tweetId });
  }

  /**
   * Retrieve a single tweet
   * @param tweetId tweet id
   */
  public async fetchTweet(tweetId) {
    return await this.client.get("statuses/show", {
      id: tweetId,
      tweet_mode: "extended"
    });
  }

  /**
   * Search Twitter for recent tweets
   * Since the results are loaded in batches of 20 tweets, max tweet id is a reference for the next batch
   * @param keyword keyword
   * @param maxId max tweet id
   */
  public async searchRecentTweets(keyword: string, maxId ? : string) {
    const res = await this.client.get("search/tweets", {
      q: keyword,
      result_type: "recent",
      count: 20,
      include_entities: true,
      tweet_mode: "extended",
      max_id: maxId
    });
    return res.data;
  }

  /**
   * Search Twitter for popular tweets
   * Since the results are loaded in batches of 20 tweets, max tweet id is a reference for the next batch
   * @param keyword keyword
   * @param maxId max tweet id
   */
  public async searchPopularTweets(keyword: string, maxId ? : string) {
    const res = await this.client.get("search/tweets", {
      q: keyword,
      result_type: "popular",
      count: 20,
      include_entities: true,
      tweet_mode: "extended",
      max_id: maxId
    });
    return res.data;
  }

  /**
   * Search Twitter for users
   * Since the API returns users paginated, a page has to be provided
   * @param keyword keyword
   * @param page page number
   */
  public async searchUsers(keyword: string, page ? : number) {
    const res = await this.client.get("users/search", {
      q: keyword,
      count: 10,
      include_entities: true,
      page: page
    });
    return res.data;
  }

  /**
   * Updates the profile description
   * @param description profile description
   */
  public async updateProfileDescription(description: string) {
    const res = await this.client.post("account/update_profile", {
      description: description
    });
    return res.data;
  }
}
