/* eslint-disable @typescript-eslint/camelcase */
import Gun from 'gun/gun';
import "gun/lib/then";

const gun = Gun(["https://hosn-twitter-app.herokuapp.com/gun"]);
const osnPrefix = "hybridOSN-v2.0.0";

export default () => {

  const publishHashtags = async hashtagEntity => {
    const timestamp = new Date().setHours(0, 0, 1, 0);
    const hashtagsSeparated = hashtagEntity
      .map(el => el.hashtag)
      .sort()
      .join("|");

    const randomId = Math.floor(Math.random() * 10000000000);
    const opts = { hashtags: hashtagsSeparated }
    const hashtags = await gun
      .get(randomId)
      .put(opts)
      .then();

    await gun
      .get(osnPrefix)
      .get("hashtags")
      .get(timestamp)
      .set(hashtags)
      .then();
  }

  const storeLastTweetHashForUser = async (userId, hash, timestamp) => {
    console.log('storeLastTweetHashForUser')
    console.log(`${userId} ${hash} ${timestamp}`)
    const tweet = await gun
      .get(timestamp)
      .put({ hash: hash, created_at: timestamp })
      .then();
    console.log(tweet)

    const tmp = await gun
      .get(osnPrefix)
      .get("tweets")
      .get(userId)
      .set(tweet)
      .then();
    console.log(tmp)
  }

  const fetchPrivateTweetHashsForUserInInterval = async (
    userId,
    intervalStart,
    intervalEnd
  ) => {
    const privateTweets = await gun
      .get(osnPrefix)
      .get("tweets")
      .get(userId)

    console.log(`${intervalStart} ${intervalEnd}`)

    if (privateTweets) {
      const entries = await Promise.all(
        Object.keys(privateTweets)
        .filter(key => key !== "_")
        .map(key => gun.get(key).then())
      );
      console.log('privateTweets')
      console.log(entries)

      return entries
        .filter(entry => {
          if (entry) {
            const createdAtDate = new Date(entry["created_at"]);
            return createdAtDate >= intervalStart && createdAtDate <= intervalEnd;
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

  const getLikes = async (tweetId) => {
    try {
      const likeEntry = await gun
        .get(osnPrefix)
        .get("likes")
        .get(tweetId)
        .then();

      if (likeEntry === undefined) {
        return 0
      } else {
        return likeEntry.likes || 0;
      }
    } catch (ex) {
      console.log(ex)
    }
  }

  const addLike = async (tweetId) => {
    console.log('addLike')
    const currentLikesCount = await getLikes(tweetId);
    console.log(currentLikesCount)
    const likes = gun.get(tweetId).put({
      likes: currentLikesCount + 1
    });
    console.log(likes)

    await gun
      .get(osnPrefix)
      .get("likes")
      .set(likes)
      .then();
    
    return await getLikes(tweetId);
  }

  const setEmail = async (userId, email) => {
    const emailadd = await gun.get(userId).put({
      email: email
    }).then();

    await gun
      .get(osnPrefix)
      .get("email")
      .set(emailadd)
      .then();

  }

  const getEmail = async (userId) => {
    const emailEntry = await gun
      .get(osnPrefix)
      .get("email")
      .get(userId)
      .then();

    if (emailEntry === undefined) {
      return null;
    } else {
      return emailEntry;
    }
  }

  const getPvtKeyHistory = async (userId) => {
    const entry = await gun
      .get(osnPrefix)
      .get("privateKey")
      .then();
      console.log("entry:",entry);

    const pvtKeyEntry = await gun
      .get(osnPrefix)
      .get("privateKey")
      .get(userId)
      .then();
    if (pvtKeyEntry === undefined) {
      return null;
    } else {
      return pvtKeyEntry;
    }
  }

  const storePrivateKeyHistory = async (userId, email, ipfs) => {
    const pvtKey = await gun.get(userId).put({
      key: ipfs
    }).then();
    console.log("pvtKey:",pvtKey);

    await gun
      .get(osnPrefix)
      .get("privateKey")
      .set(pvtKey)
      .then();
 
  //  const test = await getPvtKeyHistory(userId);
  //  console.log("test:",test);
  }

  return {
    publishHashtags,
    storeLastTweetHashForUser,
    fetchPrivateTweetHashsForUserInInterval,
    addLike,
    getLikes,
    setEmail,
    getEmail,
    storePrivateKeyHistory,
    getPvtKeyHistory
  }

}