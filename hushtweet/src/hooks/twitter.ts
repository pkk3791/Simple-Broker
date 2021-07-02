/* eslint-disable @typescript-eslint/camelcase */
import Twitter from '@/twitter-lite/twitter.js';
import { handleError } from '@/hooks/tweetUI'
import useCache from '@/hooks/cache'
let client: any = null

const ERR_CANNOT_FAVORITE_MULTIPLE_TIMES = 139
const ERR_CANNOT_RETWEET_MULTIPLE_TIMES = 327


export default () => {

  const cache = useCache()

  const initApi = (accessToken: string | undefined, accessTokenSecret: string | undefined) => {
    client = new Twitter({
      subdomain: 'api', // "api" is the default (change for other subdomains)
      version: '1.1', // version "1.1" is the default (change for other subdomains)
      consumer_key: 'fTUxAteGfpV6SvlyvveFx0W0k', // from Twitter.
      consumer_secret: 'gJEwXanzJk3IYnbBPjMBR7hl9hepAnvhhoK1rJh7nts6JAiSao', // from Twitter.
      access_token_key: accessToken, // from your User (oauth_token)
      access_token_secret: accessTokenSecret, // from your User (oauth_token_secret)
    })
  }

  const resetApi = () => {
    client = null
  }

  const fetchSingleTweet = async (id) => {
    try {
      const result = await client.get(`statuses/show/${id}`, {
        trim_user: false,
        include_entities: true,
        include_my_retweet: true,
        tweet_mode: 'extended',
      })
      return {
        ...result
      }
    } catch (e) {
      handleError(e)
    }
  }

  const postTweet = async (data) => {
    try {
      const result = await client.post(`statuses/update`, {
        ...data
      })
      return {
        ...result
      }
    } catch (e) {
      handleError(e)
    }
    return false
  }

  const getFriendIds = async (userId = null, screenName = null) => {
    try {
      let friendIds = cache.get(`friends-${screenName || userId}`) || null
      if (!friendIds) {
        const { ids } = await client.get(`friends/ids`, {
          ...(userId ? { user_id: userId } : {}),
          ...(screenName ? { screen_name: screenName } : {})
        })
        friendIds = ids
        cache.put(`friends-${userId || screenName}`, ids)
      }
      return friendIds
    } catch (e) {
      handleError(e)
    }
    return []
  }

  const retweet = async (id, retweeted) => {
    try {
      const result = await client.post(`statuses/${retweeted ? 'unretweet' : 'retweet'}/${id}`)
      return {
        ...result
      }
    } catch (e) {
      if (e.errors && e.errors.length) {
        const code = e.errors[0].code
        if (code === ERR_CANNOT_RETWEET_MULTIPLE_TIMES)
          return true
        else handleError(e)
      } else {
        handleError(e)
      }
    }
    return false
  }

  const toggleFavorite = async (tweet) => {
    const action = tweet.favorited ? 'destroy' : 'create'
    
    try {
      const result = await client.post(`favorites/${action}`, {
        id: tweet.id_str,
      })
      return result
    } catch (e) {
      if (e.errors && e.errors.length) {
        const code = e.errors[0].code
        if (code === ERR_CANNOT_FAVORITE_MULTIPLE_TIMES)
          return {
            ...tweet,
            favorited: true,
          }
        else handleError(e)
      } else {
        handleError(e)
      }
    }
  }

  return {
    client,
    initApi,
    resetApi,
    toggleFavorite,
    fetchSingleTweet,
    postTweet,
    retweet,
    getFriendIds
  }
}
