<template>
  <ion-content :scroll-events="true" @ionScroll="onScroll">
    <ion-refresher ref="refresher" slot="fixed" @ionRefresh="doRefresh">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>
    <slot></slot>
    <!-- <template v-if="errors.length > 0">
      <div class="error" v-for="error in errors" :key="error.message">
        <div class="error-text" style="margin-top: 0">
          <ion-badge class="error-code" color="danger">{{error.code}}</ion-badge>
          <div>{{error.message}}</div>
        </div>
      </div>
    </template> -->
    <template v-if="isLoading && tweetList.length == 0">
      <tweet v-for="index in 8" :key="index"></tweet>
    </template>
    <div class="tweet-list" ref="lstTweets">
      <template v-if="tweetList.length > 0">
        <tweet v-for="tweet in tweetList" :key="tweet.id_str" :value="tweet"></tweet>
      </template>
      <p v-else-if="!isLoading && !!searchQuery" class="ion-text-center">
        Nothing found
      </p>
    </div>
    <ion-infinite-scroll threshold="100px" @ionInfinite="loadData($event)">
      <ion-infinite-scroll-content
        loadingSpinner="dots">
      </ion-infinite-scroll-content>
    </ion-infinite-scroll>
  </ion-content>
</template>
<style lang="css" scoped>
ion-content {
  overflow: auto;
}
.error {
  display: flex;
  height: 200px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-bottom: dashed 3px var(--ion-color-danger);
}
.error img {
  width: 150px;
}
.error .error-text {
  width: 100%;
  text-align: center;
  margin-top: 50px;
}
.error-code {
  font-size: 1rem;
  margin-top: 10px;
}
 
</style>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { IonContent, IonRefresher, IonBadge, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, toastController } from '@ionic/vue';
import Tweet from '@/components/tweet/index.vue'
import { ref, Ref, watch, computed, onMounted, defineComponent } from 'vue';
import { subSeconds, addSeconds } from 'date-fns'
import useTwitter from '@/hooks/twitter';
import { uniqBy, take } from 'ramda';
import Storage from '@/utils/storage'
import useGUN from '@/secure/gun.js'
import usePGP from '@/secure/pgp'
import useIPFS from '@/secure/ipfs'
import useCrypto from '@/secure/crypto'
import useFirebaseAuth from "@/hooks/firebase";
import { subDays } from 'date-fns'
export default defineComponent({
  components: {
    IonContent, IonRefresher, /*IonBadge,*/ IonRefresherContent, Tweet,
    IonInfiniteScroll, IonInfiniteScrollContent
  },
  name: 'Timeline',
  props: {
    screenName: {
      type: String,
      default: null,
    },
    isPersonal: {
      type: Boolean,
      default: false,
    },
    includeReplies: {
      type: Boolean,
      default: false,
    },
    isMentionsTimeline: {
      type: Boolean,
      default: false,
    },
    isSearch: {
      type: Boolean,
      default: false,
    },
    searchQuery: {
      type: String,
      default: null,
    },
    batchCount: {
      type: Number,
      default: 20,
    },
    searchResultType: {
      type: String,
      default: 'popular',
    },
    repliesTo: {
      type: String,
      default: null
    }
  },
  setup(props, { emit }) {
    const tweetList = ref([] as any[])
    const isLoading = ref(true)
    const errors = ref([] as any[])
    const maxId: any = ref(null)
    const sinceId: any = ref(null)
    const timelineName = computed(() => {
      if (props.isMentionsTimeline) return 'mentions'
      if (props.isPersonal) return 'user'
      return 'home'
    })
    const endPoint = computed(() => {
      return props.isSearch
        ? `search/tweets`
        : `statuses/${timelineName.value}_timeline`
    })
    const preprocessTweets = (tweets: any[]) => {
      return tweets.map((_) => ({
        ..._,
        created_at: new Date(_.created_at),
      }))
    }
    const sortTweets = (tweets: any[], dateOnly = false) => {
      return props.isSearch
        ? tweets
        : [...new Map(tweets.map((x: any) => [x.id_str, x])).values()].sort((a: any, b: any) => {
            if (!dateOnly) {
              if (a.in_reply_to_status_id === b.id) {
                b.isNextTweetConnected = true
                a.hasConnectedStatus = true
                return 1
              }
              if (b.in_reply_to_status_id === a.id) {
                a.isNextTweetConnected = true
                b.hasConnectedStatus = true
                return -1
              }
            }
            if (a.created_at < b.created_at) return 1
            if (a.created_at > b.created_at) return -1
            return 0
          })
    }

    const { client, getFriendIds, fetchSingleTweet } = useTwitter()
    const gun = useGUN()
    const pgp = usePGP()
    const ipfs = useIPFS()
    const crypto = useCrypto()
    const { getUserId } = useFirebaseAuth()

    const fetchUsersPublicKeys = async (userIds) => {
      console.log('Fetch email address of all friends from gunDB')
      const emailPromises: Promise < string > [] = userIds.map(accountId => {
        return gun.getEmail(
          accountId
        );
      });

      const resolvedPromises = await Promise.all(emailPromises);
      for (let i = 0; i < resolvedPromises.length; i++) {
        if (resolvedPromises[i]) {
          const email = resolvedPromises[i]["email"];
          console.log("email is:", email);
          if(email){
            pgp.lookupKeys(email);
          }
        }
      }
    }

    const getPrivateKeyAt = async (
      timestamp: string,
      privateKeyHistory: any
    ) => {
      if(!privateKeyHistory) return await Storage.getItem("privateKey") ;
      const timestampTweet = new Date(timestamp).getTime();
      for (const key of privateKeyHistory) {
        const timestampKey = new Date(key["validFrom"]).getTime();
        if (timestampTweet > timestampKey) {
          return key["key"];
        }
      }
      // todo: throw error
      return null;
    }

    const fetchPrivateTweets = async (privateTweetsData: object[]) => {
      console.log('fetchPrivateTweets')
      console.log(privateTweetsData);
      const privateTweets: any = [];

      // Load private tweets from P2P storage
      // console.log("privateTweetsData.length",privateTweetsData.length);
      for (let i = 0; i < privateTweetsData.length; i++) {
        let pvtKeyTimestamped;

        const hash = privateTweetsData[i]["hash"];
        const userId = privateTweetsData[i]["userId"];
        const timestamp = privateTweetsData[i]["created_at"];

        // fetch from IPFS
        const encryptedTweet = await ipfs.fetchTweet(hash);
        console.log('encryptedTweet')
        console.log(encryptedTweet)

        if (!encryptedTweet) {
          return;
        }

        // Fetch private key history for user
        try {
          const privateKeyHistory = await crypto.fetchPrivateKeyHistoryForUser(
            userId
          );
          console.log('privateKeyHistory')
          console.log(privateKeyHistory)

          pvtKeyTimestamped = await  getPrivateKeyAt(timestamp, privateKeyHistory);
          console.log("private key valid for ", timestamp, "is:",pvtKeyTimestamped);

          if(pvtKeyTimestamped){
            const armrdpvtkey = await pgp.getArmoredPrivateKey(pvtKeyTimestamped);
            console.log("decrypted private key is:",armrdpvtkey);

            const decryptedTweet: any = await pgp.decrypt(encryptedTweet, armrdpvtkey);
            console.log("decryptedTweet:",decryptedTweet)
            if (decryptedTweet)
              privateTweets.push({
                id_str: hash,
                ...JSON.parse(decryptedTweet)
              });
          }
        } catch (err) {
          console.log("Error caught in feed",err);
        }

        // let pvtKey = await this.storage.get("privateKey");
      }
      if (privateTweets.length > 0) {
        console.log('Attaching data to private tweet')
        const cachedUsers = {}

        for (let i = 0; i < privateTweets.length; i++) {
          privateTweets[i] = await (async t => {
            try {
              const user = cachedUsers[t.user_id] || await client.get('users/show', {
                user_id: t.user_id
              })
              cachedUsers[t.user_id] = t.user
              console.log(t)

              if (t.quoted_status_id) {
                const tmp = await fetchSingleTweet(t.quoted_status_id)
                return {
                  ...t,
                  user,
                  quoted_status: tmp
                }
              } else if (t.in_reply_to_status_id) {
                const tmp = await fetchSingleTweet(t.in_reply_to_status_id)
                return {
                  ...t,
                  user,
                  in_reply_to_screen_name: tmp ? tmp.user.screen_name : null
                }
              }
              return {
                ...t,
                user
              }
            } catch(ex) {
              console.log(ex)
              return t
            }
          })(privateTweets[i])
        }
      }

      console.log('privateTweets')
      console.log(privateTweets)

      return privateTweets;

    }

    const loadPrivateTweetTimeline = async (intervalStart, intervalEnd) => {
      const screenName: any = props.screenName || null
      let userIds: any = []
      if (timelineName.value == 'home') {
        userIds = [
          ...await getFriendIds(getUserId(), screenName),
          getUserId()
        ]
      } else if (props.isPersonal) {
        const user = await client.get('users/show', {
          screen_name: screenName.replace('@', '')
        })
        userIds.push(user.id_str)
      } else {
        return []
      }

      console.log(`Fetching private tweets for user ids: ${userIds}`)

      const promises: Promise < any[] > [] = userIds.map(accountId => {
        return gun.fetchPrivateTweetHashsForUserInInterval(
          accountId,
          new Date(intervalStart),
          new Date(intervalEnd)
        );
      });

      const resolvedPromises = await Promise.all(promises);
      await fetchUsersPublicKeys(userIds)
      console.log(resolvedPromises)

      const privateTweetHashes = resolvedPromises.reduce(
        (privateTweets, el) => privateTweets.concat(el),
        []
      );
      console.log(`privateTweetHashes: ${privateTweetHashes}`)

      const privateTweets = await fetchPrivateTweets(privateTweetHashes.filter(h => !tweetList.value.find(_ => _.id_str == h.hash)));

      return privateTweets

    }

    const refreshTimeline = async () => {
      
      if (props.isPersonal && !props.screenName) return
      try {

        errors.value = []
        isLoading.value = true
        let tweets = await client.get(endPoint.value, {
          count: props.batchCount,
          include_entities: true,
          tweet_mode: 'extended',
          ...(props.isSearch
            ? {
                ...(props.repliesTo ? {
                  include_replies: true,
                  since_id: props.repliesTo
                } : {}),
                result_type: props.searchResultType,
                q: props.searchQuery,
                ...(sinceId.value && !props.repliesTo ? { since_id: sinceId.value } : {})
              }
            : {
                ...(props.isPersonal ? { screen_name: props.screenName } : {}),
                ...(sinceId.value ? { since_id: sinceId.value } : {}),
                include_replies: props.isMentionsTimeline || props.includeReplies,
                exclude_replies:
                  !props.isMentionsTimeline && !props.includeReplies,
              }),
        })

        if (props.isSearch) tweets = tweets.statuses
        if (tweets.length) {
          maxId.value = tweets[tweets.length - 1].id_str
          sinceId.value = tweets[0].id_str
        }
        if (!props.isSearch) {
          tweets = tweets.concat(await loadPrivateTweetTimeline(
            tweets.length ? tweets[tweets.length - 1].created_at : subDays(new Date(), 7),
            new Date()
          ))
          // console.log(tweets)
        }
        if (props.repliesTo) {
          tweets = tweets.filter(_ => _.in_reply_to_status_id_str == props.repliesTo)
        }
        tweetList.value = sortTweets(
          uniqBy(t => t.id_str, preprocessTweets(tweets).concat(sinceId.value ? tweetList.value : []))
        )
        if (tweets.length && timelineName.value == 'home') {
          Storage.setItem('user.timeline.tweets', JSON.stringify(take(20, sortTweets(tweetList.value, true))))
        }
      } catch (e) {
        let error = e.toString()
        if (e.errors && e.errors.length) {
          error = e.errors[0].message
        }
        const toast = await toastController
          .create({
            message: error,
            duration: 5000,
            color: 'danger',
            position: 'top'
          })
        toast.present();
        errors.value = e.errors || []
      } finally {
        isLoading.value = false
      }
    }

    const loadMore = async () => {
      try {
        let tweets: any | any[] = await client.get(endPoint.value, {
          count: props.batchCount,
          max_id: maxId.value,
          include_entities: true,
          ...(props.isSearch
            ? {
                result_type: props.searchResultType,
                q: props.searchQuery,
                tweet_mode: 'extended'
              }
            : {
                ...(props.isPersonal ? { screen_name: props.screenName } : {}),
                tweet_mode: 'extended',
                include_replies:
                  props.isMentionsTimeline || props.includeReplies,
                exclude_replies:
                  !props.isMentionsTimeline && !props.includeReplies,
              }),
        })
        if (props.isSearch) tweets = tweets.statuses
        
        if (tweets.length) {
          maxId.value = tweets[tweets.length - 1].id_str
        }
        if (!props.isSearch) {
          tweets = tweets.concat(await loadPrivateTweetTimeline(tweets[tweets.length - 1].created_at, tweets[0].created_at))
          // console.log(tweets)
        }
        const temp: any[] = []
        for (let i = 1; i < tweets.length; i++) temp.push(tweets[i])
        const extendedBatch = tweetList.value.length < 20
        tweetList.value = uniqBy(t => t.id_str, sortTweets([
          ...tweetList.value,
          ...preprocessTweets(temp),
        ]))
        if (timelineName.value == 'home' && extendedBatch) {
          Storage.setItem('user.timeline.tweets', JSON.stringify(take(20, sortTweets(tweetList.value, true))))
        }
      } catch (e) {
        let error = e.toString()
        if (e.errors && e.errors.length) {
          error = e.errors[0].message
        }
        const toast = await toastController
          .create({
            message: error,
            duration: 5000,
            color: 'danger',
            position: 'top'
          })
        toast.present();
        console.log(e)
      } finally {
        // isLoadingMore.value = false
      }
    }

    watch(() => props.searchQuery, (v, o) => {
      sinceId.value = false
      tweetList.value = []
      refreshTimeline()
    })

    watch(() => props.searchResultType, (v, o) => {
      sinceId.value = false
      tweetList.value = []
      refreshTimeline()
    })

    watch(() => props.screenName, (v, o) => {
      sinceId.value = false
      tweetList.value = []
      refreshTimeline()
    })

    watch(() => props.isMentionsTimeline, (v, o) => {
      sinceId.value = false
      tweetList.value = []
      refreshTimeline()
    })

    watch(() => props.includeReplies, (v, o) => {
      sinceId.value = false
      tweetList.value = []
      refreshTimeline()
    })

    const coldStart = async () => {
      if (!props.isSearch && timelineName.value == 'home') {
        const cached = JSON.parse((await Storage.getItem('user.timeline.tweets')) || '[]')
        if (cached.length) {
          sinceId.value = (cached.filter(_ => !_.private_tweet) || {}).id_str || null
          maxId.value = cached[cached.length - 1].id_str
          tweetList.value = sortTweets(
            uniqBy(t => t.id_str, preprocessTweets(cached))
          )
        }
      }
      await refreshTimeline()
    }

    onMounted(() => {
      coldStart()
    })

    return {
      errors,
      tweetList,
      isLoading,
      onScroll(e) {
        emit('scroll', e)
      },
      async loadData(event: any) {
        await loadMore()
        event.target.complete()
      },
      async doRefresh(event: any) {
        await refreshTimeline()
        if (event && event.target) {
          event.target.complete()
        }
      }
    }
  }
})
</script>