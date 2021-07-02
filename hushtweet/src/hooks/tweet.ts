/* eslint-disable @typescript-eslint/camelcase */
import { Ref, ComputedRef, ref, reactive, computed } from 'vue'
import { format } from 'date-fns'
import timeago from '@/utils/timeago'
import useTwitter from './twitter'
import { view, lensPath } from 'ramda'
import useContent from './tweet/content'
import { useAsyncState } from '@vueuse/core'
import useGUN from '@/secure/gun.js'
import friendlyNumber from '@/utils/friendlyNumber'
import { handleError } from '@/hooks/tweetUI'

export default (value, isQuote: Ref<boolean>) => {

  const { toggleFavorite, retweet } = useTwitter()

  const _originalTweet = ref(value)
  const _tweet = ref(value ? (value.retweeted_status || value) : null)
  const tweet: any = computed(() => _tweet.value || {})
  
  const { content, observe, unobserve, hasIntersected, isIntersecting, hasPreviewUrl, previewUrlReady } = useContent(tweet, isQuote)

  const isLoading = computed(() => !_tweet.value)

  const favorited = computed(() => tweet.value.favorited || false)
  const favoritedChanged = ref(false)
  const retweeted = computed(() => tweet.value.retweeted || false)
  const retweetedChanged = ref(false)

  const favoriteCount = computed(() => friendlyNumber(tweet.value.favorite_count))
  const retweetCount = computed(() => friendlyNumber(tweet.value.retweet_count))

  const currentTime = computed(() => new Date())
  const postTime = computed(() => {
    const parsed = new Date(tweet.value.created_at || null)
    const dummy = currentTime.value
    dummy.toString()
    return tweet.value
      ? parsed.getFullYear() !== new Date().getFullYear()
        ? format(parsed, 'dd.MM.yy')
        : timeago.format(parsed, 'twitter')
      : null
  })
  const postDetailedTime = computed(() => {
    const parsed = new Date(tweet.value.created_at || null)
    const dummy = currentTime.value
    dummy.toString()
    return tweet.value
      ? format(parsed, 'HH:mm dd MMM yy')
      : null
  })

  const { getLikes, addLike } = useGUN()
  const currentPrivateLikes = ref(0)
  const { state: privateLikes, ready: privateLikesReady } = useAsyncState((async () => {
    currentPrivateLikes.value = await getLikes(tweet.value.id_str)
    return currentPrivateLikes.value
  })(), 0)

  const isReply = computed(() => !!tweet.value.in_reply_to_status_id)
  const isPrivate = computed(() => tweet.value.private_tweet)
  
  const place = computed(() => view(lensPath(['place', 'full_name']), tweet.value) || false)
  const inlinePlace = computed(() => {
    // The place will be displayed inline in a tweet only if the tweet is not a reply
    return isReply.value ? place.value : false
  })
  const permaLink = computed(() => _originalTweet.value ? `https://twitter.com/${_originalTweet.value.user.screen_name}/status/${_originalTweet.value.id_str}` : false)

  return {
    tweet,
    isLoading,
    isPrivate,
    postDetailedTime,

    favorited,
    favoritedChanged,
    retweeted,
    retweetedChanged,
    favoriteCount,
    retweetCount,
    postTime,

    place,
    inlinePlace,
    permaLink,

    content,
    hasPreviewUrl,
    previewUrlReady,

    privateLikes: currentPrivateLikes,
    privateLikesReady,

    hasIntersected,
    isIntersecting,
    observe,
    unobserve,

    addPrivateFavorite: async () => {
      try {
        console.log('addPrivateFavorite')
        currentPrivateLikes.value = currentPrivateLikes.value + 1
        const tmp = await addLike(_tweet.value.id_str)
        currentPrivateLikes.value = tmp
      } catch (e) {
        handleError(e)
      }
    },

    toggleFavorite: async () => {
      try {
        const original = {
          ..._tweet.value
        }
        _tweet.value = {
          ..._tweet.value,
          favorited: !original.favorited,
          favorite_count: original.favorite_count + (original.favorited ? -1 : 1) 
        }
        favoritedChanged.value = true
        const { favorite_count, retweet_count, favorited, retweeted } = await toggleFavorite(original)
        _tweet.value = {
          ..._tweet.value,
          favorited,
          retweeted,
          favorite_count,
          retweet_count
        }
        favoritedChanged.value = false
      } catch (e) {
        handleError(e)
      }
    },

    retweet: async () => {
      try {
        const original = {
          ..._tweet.value
        }
        _tweet.value = {
          ..._tweet.value,
          retweeted: !original.retweeted,
          retweet_count: original.retweet_count + (original.retweeted ? -1 : 1) 
        }
        retweetedChanged.value = true
        const { favorite_count, retweet_count, favorited, retweeted } = await retweet(original.id_str, original.retweeted)
        _tweet.value = {
          ..._tweet.value,
          favorited,
          retweeted,
          favorite_count,
          retweet_count
        }
        retweetedChanged.value = false
      } catch (e) {
        handleError(e)
      }
    }
  }
}