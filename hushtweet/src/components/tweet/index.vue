<template>
  <div @click="showDetails($event)" ref="el" class="tweet animate__faster animate__slideInUp" :class="{ 'is-readonly': readonly, 'is-loading': isLoading, 'is-detail': isDetailView, 'is-private': isPrivate, 'has-status': !isLoading && !!value.retweeted_status, 'is-quote': isQuote, 'is-next-connected': !isLoading && !!value.isNextTweetConnected }">
    <tweet-avatar v-if="!isQuote && !isDetailView" :readonly="readonly" slot="start" :isLoading="isLoading" :user="isLoading ? null : tweet.user" />
    <div class="tweet-content">
      <div :class="{ 'tweet-header': true,  'is-replying': tweet && !isQuote && tweet.in_reply_to_status_id && !tweet.hasConnectedStatus }">
        <tweet-avatar v-if="isQuote || isDetailView" :readonly="readonly" :isQuote="isQuote" :isLoading="isLoading" :user="isLoading ? null : tweet.user" />
        <div class="tweet-names">
          <div class="tweet-status" style="width: 100%" v-if="!isLoading && !!value.retweeted_status">
            <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.44444 4.44444H15.5556V7.11111L20 3.55556L15.5556 0V2.66667H2.22222V8H4.44444V4.44444ZM15.5556 13.3333H4.44444V10.6667L0 14.2222L4.44444 17.7778V15.1111H17.7778V9.77778H15.5556V13.3333Z" fill="#999999"></path>
            </svg>
            <div class="retweeted-details" style="display: flex; width: 100%">
              <span class="name" style="width: 100%">{{value.retweeted ? 'you' : value.user.name}}&nbsp;retweeted</span>
            </div>
          </div>
          <div class="tweet-name">
            <ion-skeleton-text v-if="isLoading"></ion-skeleton-text>
            <template v-else-if="readonly">{{tweet.user.name}}</template>
            <router-link v-else :to="`/profile/@${tweet.user.screen_name}`">{{tweet.user.name}}</router-link>
          </div>
          <div class="tweet-user">
            <ion-skeleton-text v-if="isLoading"></ion-skeleton-text>
            <template v-else-if="readonly">@{{tweet.user.screen_name}}</template>
            <router-link fill="clear" v-else :to="`/profile/@${tweet.user.screen_name}`">@{{tweet.user.screen_name}}</router-link>
          </div>
        </div>
        <div class="tweet-time" v-if="!isDetailView">
          <ion-skeleton-text v-if="isLoading"></ion-skeleton-text>
          <template v-else>{{postTime}}</template>
        </div>
      </div>
      <div class="tweet-text">
        <ion-skeleton-text v-if="isLoading"></ion-skeleton-text>
        <template v-else>
          <div class="tweet-reply-to" v-if="tweet.in_reply_to_status_id && !isQuote && !tweet.hasConnectedStatus">
            Replying to
            <template v-if="readonly">@{{tweet.in_reply_to_screen_name}}</template>
            <router-link v-else :to="`/profile/@${tweet.in_reply_to_screen_name}`">@{{tweet.in_reply_to_screen_name}}</router-link>
          </div>
          <template v-for="(node, i) in content" :key="i">
            <span v-if="node.type == 'text'">{{node.value}}</span>
            <a href="javascript:;" v-else-if="node.type == 'hashtag' && readonly">&#35;{{node.text}}</a>
            <router-link v-else-if="node.type == 'hashtag'" :to="`/search/%23${node.text}`">&#35;{{node.text}}</router-link>
            <span v-else-if="node.type == 'html'" v-html="node.value"></span>
            <a v-else-if="node.type == 'url'" :href="node.expanded_url" target="_blank">{{node.display_url}}</a>
            <a href="javascript:;" v-else-if="node.type == 'user_mention' && readonly">@{{node.screen_name}}</a>
            <router-link v-else-if="node.type == 'user_mention'" :to="`/profile/@${node.screen_name}`">@{{node.screen_name}}</router-link>
            <div 
              class="tweet-media tweet-image" 
              @click="openGallery([node])" 
              :data-resize="node.resize"
              v-else-if="node.type == 'photo'"
              :style="{ 'background-image': `url(${node.media_url_https})`, 'background-position': node.resize == 'fit' ? '50% 50%' : 'top center' }"
            ></div>
            <div class="tweet-media tweet-gallery" v-else-if="node.type == 'gallery'" :class="`tweet-gallery-${node.photos.length}`">
              <div 
                class="tweet-image" 
                @click="openGallery(node.photos, index)" 
                v-for="(photo, index) in node.photos" 
                :key="photo.media_url_https" 
                :data-resize="photo.resize"
                :style="{ 'background-image': hasIntersected ? `url(${photo.media_url_https})`: 'none' }">
              </div>
            </div>
            <div v-else-if="node.type == 'video'" class="tweet-media" style="max-height: 200px">
              <vue-plyr class="tweet-video" :options="isQuote ? { controls: ['play-large', 'play', 'mute', 'volume', 'fullscreen'] } : {}">
                <video :poster="node.media_url_https" :src="node.video_info.variants[0].url">
                  <source v-for="(variant, i) in node.video_info.variants" :key="i" :src="variant.url" :type="variant.content_type" />
                </video>
              </vue-plyr>
            </div>
            <div v-else-if="node.type == 'animated_gif'" class="tweet-media tweet-gif" style="max-height: 200px;">
              <vue-plyr class="tweet-video" :options="{ controls: ['play-large'] }">
                <video :poster="node.media_url_https" :autoplay="hasIntersected" loop :src="node.video_info.variants[0].url">
                  <source v-for="(variant, i) in node.video_info.variants" :key="i" :src="variant.url" :type="variant.content_type" />
                </video>
              </vue-plyr>
            </div>
            <div v-else-if="node.type == 'youtube_preview'" class="tweet-media" style="max-height: 200px">
              <vue-plyr class="tweet-video" :options="{ controls: ['play-large'] }">
                <iframe
                  :src="node.url"
                  style="border: 0; width: 100%; border-radius: 6px"
                  allowfullscreen
                  allowtransparency
                  allow="autoplay"
                ></iframe>
              </vue-plyr>
            </div>
            <a class="tweet-media tweet-url" v-else-if="node.type == 'preview_url'" :href="node.expanded_url" target="_blank">
              <div class="tweet-url-preview" v-if="node.meta.image" :style="hasIntersected ? `background-image: url(${node.meta.image})`: ''"></div>
              <div class="tweet-url-title">
                {{node.meta.title}}
                <div class="tweet-url-domain" v-if="node.meta.domain">
                  {{node.meta.domain}}
                </div>
              </div>
            </a>
            <!-- <vue-poll v-else-if="node.type == 'poll'"></vue-poll> -->
          </template>
          <div class="tweet-media tweet-url" v-if="hasPreviewUrl && !previewUrlReady">
            <div class="tweet-url-preview">
              <ion-skeleton-text style="position: absolute; top: 3px; left: 8px; width: calc(100% - 16px); height: calc(100% - 16px)"></ion-skeleton-text>
            </div>
            <div class="tweet-url-title">
              <ion-skeleton-text style="width: 100%"></ion-skeleton-text>
              <ion-skeleton-text style="width: 100%; height: 0.8rem; margin-bottom: 0"></ion-skeleton-text>
            </div>
          </div>
          <span class="tweet-place" v-if="!tweet.in_reply_to_status_id && tweet.place && !isQuote && !isDetailView && !(hasPreviewUrl && previewUrlReady)">
            &nbsp;&mdash;&nbsp;at {{tweet.place.full_name}}
          </span>
          <tweet v-if="tweet.quoted_status" :value="tweet.quoted_status" :isQuote="true"></tweet>
        </template>
      </div>
      <div v-if="isDetailView" class="tweet-details">
        <ion-skeleton-text v-if="isLoading"></ion-skeleton-text>
        <template v-else>
          <span>{{postDetailedTime}}</span>
          <span>&bull;</span>
          <template v-if="!tweet.in_reply_to_status_id && tweet.place">
            <span>
              {{tweet.place.full_name}}
            </span>
            <span>&bull;</span>
          </template>
          <span v-html="tweet.source"></span>
        </template>
      </div>
      <div class="tweet-actions" v-if="!isLoading && !isQuote && !hideActions">
        <div v-if="!isPrivate" class="tweet-action" @click="replyTo">
          <ion-icon :icon="arrowUndoOutline" style="width: 20px; height: 20px" />
        </div>
        <div v-if="!isPrivate" class="tweet-action tweet-action-favorite" :class="{ 'is-active animate__heartBeat': favorited, 'animate__animated': favoritedChanged, 'animate__rubberBand': !favorited }" @click="toggleFavorite">
          <ion-icon :icon="favorited ? heart : heartOutline" style="width: 20px; height: 20px" />
          <template v-if="favoriteCount">{{favoriteCount}}</template>
        </div>
        <div class="tweet-action tweet-action-favorite is-private" @click="addPrivateFavorite">
          <ion-icon :icon="heartOutline" style="width: 20px; height: 20px" />
          <template v-if="privateLikesReady">{{privateLikes}}</template>
        </div>
        <a v-if="!isPrivate" href="javascript:;" @click="showRetweetOptions" class="tweet-action tweet-action-retweet" :class="{ 'is-active': retweeted }">
          <ion-icon :icon="gitCompareOutline" style="width: 20px; height: 20px" />
          <template v-if="retweetCount">{{retweetCount}}</template>
        </a>
        <div v-if="permaLink" class="tweet-action tweet-action-share" @click="share">
          <ion-icon :icon="shareSocialOutline" style="width: 20px; height: 20px" />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { IonSkeletonText, modalController, IonIcon, toastController, actionSheetController } from '@ionic/vue';
import { ref, watch, defineComponent, onMounted, onBeforeUnmount } from 'vue';
import useTweetUI from '@/hooks/tweetUI'
import Gallery from './gallery.vue'
import TweetAvatar from './avatar.vue'
import { Plugins } from '@capacitor/core';
const { Share } = Plugins;
import { shareSocialOutline, heartOutline, lockClosedOutline, closeOutline, pencilOutline, heart, arrowUndoOutline, gitCompareOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router'
import useTweet from '@/hooks/tweet'
import useTwitter from '@/hooks/twitter';
import useGUN from '@/secure/gun.js'
import { handleError } from '@/hooks/tweetUI'
export default defineComponent({
  name: 'Tweet',
  components: {
    TweetAvatar,
    IonSkeletonText,
    IonIcon
  },
  setup(props) {
    const el = ref(null);
    const router = useRouter()
    const { writeTweet } = useTweetUI()
    const {
      tweet, 
      isLoading,
      isPrivate,

      favorited,
      favoritedChanged,
      retweeted,
      favoriteCount,
      retweetCount,
      postTime,
      inlinePlace,
      content,

      permaLink,

      toggleFavorite,
      addPrivateFavorite,
      retweet,

      observe,
      unobserve,
      hasIntersected,
      postDetailedTime,

      hasPreviewUrl,
      previewUrlReady,
      privateLikes,
      privateLikesReady
    } = useTweet(props.value, ref(props.isQuote))
    
    onMounted(() => {
      observe(el.value);
    });

    onBeforeUnmount(() => {
      unobserve(el.value);
    });

    
    const replyTo = async () => {
      await writeTweet(tweet.value)
    }

    const showRetweetOptions = async () => {
      const actionSheet = await actionSheetController
        .create({
          header: 'Retweet & quote',
          buttons: [
            {
              text: tweet.value.retweeted ? 'Unretweet' : 'Retweet',
              // role: 'destructive',
              icon: gitCompareOutline,
              handler: async () => {
                await retweet()
              },
            },
            {
              text: 'Quote',
              icon: pencilOutline,
              handler: async () => {
                await writeTweet(null, tweet.value)
              },
            },
            {
              text: 'Cancel',
              role: 'cancel',
              icon: closeOutline,
              handler: () => {
                console.log('Cancel clicked')
              },
            },
          ],
        });
      return actionSheet.present();
    }

    return {
      replyTo,
      isPrivate,
      privateLikes,
      privateLikesReady,
      addPrivateFavorite,
      showDetails: (e) => {
        if (
          props.isDetailView ||
          e.target.tagName == 'A' || !!e.target.className.match(/media|action/) ||
          e.target.parentNode.tagName == 'A' || !!e.target.parentNode.className.match(/media|action/)
        ) return
        router.push(`/tweet/${tweet.value.id_str}`)
      },
      el,
      hasIntersected,
      postDetailedTime,
      showRetweetOptions,

      heartOutline, 
      heart, 
      arrowUndoOutline, 
      gitCompareOutline,
      shareSocialOutline,

      tweet,
      hasPreviewUrl,
      previewUrlReady,
      
      favorited,
      favoritedChanged,
      retweeted,
      favoriteCount,
      retweetCount,
      isLoading,
      postTime,
      inlinePlace,

      permaLink,

      content,
      async share() {
        try {
          await Share.share({
            title: 'See cool stuff',
            text: String(permaLink.value),
            url: String(permaLink.value),
            dialogTitle: 'Share'
          })
        } catch (ex) {
          const toast = await toastController
            .create({
              message: ex,
              duration: 5000,
              color: 'danger',
              position: 'top'
            })
          toast.present();
        }
      },
      async openGallery(images: any[], activeSlide = 0) {
        const modal = await modalController
          .create({
            component: Gallery,
            componentProps: {
              images,
              activeSlide,
              closeHandler: () => {
                modal.dismiss()
              }
            },
          })
        return modal.present();
      },

      toggleFavorite
    }
  },
  props: {
    readonly: {
      type: Boolean,
      default: false
    },
    hideActions: {
      type: Boolean,
      default: false
    },
    isDetailView: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object,
      default: null,
    },
    isQuote: {
      type: Boolean,
      default: false,
    },
  }
})
</script>
<style lang="css" scoped>
.tweet {
  padding: 15px 25px;
  display: flex;
  flex-direction: row;
  position: relative;
}
.tweet.is-loading .tweet-names > div {
  width: 50%;
}
.tweet-details {
  margin-top: 20px;
  font-size: 0.8rem;
  display: flex;
  border-top: solid 1px #eee;
  border-bottom: solid 1px #eee;
  padding: 10px 0;
}
.tweet-details > span {
  margin-right: 10px;
}
.tweet.is-private {
  background-color: rgba(0, 0, 0, .08);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'%3E%3Ctitle%3ELock Closed%3C/title%3E%3Cpath fill='rgba(0, 0, 0, 0.1)' d='M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 11128 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: 40px auto;
  background-position: 21px 70px;
  
}
.tweet.is-private:not(:last-of-type) + .tweet.is-private {
  border-top: solid 1px #ccc;
}
.tweet-url {
  border: solid 1px #eee;
  border-radius: 8px;
  overflow: hidden;
  display: block;
}
.tweet-url-preview {
  background-repeat: no-repeat;
  background-size: cover;
  padding-top: 52%;
  position: relative;
}
.tweet-url-preview + .tweet-url-title {
  border-top: solid 1px #eee;
}
.tweet-url-title {
  padding: 5px 8px 8px;
  font-size: 0.8rem;
  color: #000;
}
.tweet-url-domain {
  color: #999;
  margin-top: 2px;
}
.tweet.is-next-connected {
  border-bottom: 0!important;
}
.tweet.is-next-connected::after {
  width: 2px;
  left: 41px;
  top: 47px;
  height: calc(100% - 17px);
  content: '';
  background: #eee;
  position: absolute;
  display: block;
}
.tweet-place {
  color: #aaa;
}
.tweet .retweeted-details {
  display: flex;
}
.tweet-gif {
  position: relative;
}
.tweet-gif:after {
  content: 'GIF';
  display: block;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: #fff;
  width: 20px;
  text-align: center;
  padding: 1px 4px 2px;
  position: absolute;
  font-size: 10px;
  bottom: 2px;
  left: 2px;
  z-index: 1;
}
.tweet .retweeted-details .name {
  max-width: 60%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: inline-block;
}
 .tweet.has-status {
  padding-top: 30px;
}
 .tweet:first-of-type {
  padding-top: 25px;
}
 .tweet:first-of-type.has-status {
  padding-top: 30px;
}
 .tweet:not(:last-of-type) {
  border-bottom: solid 1px #eee;
}
 .tweet-image {
  display: block;
  width: 100%;
  padding-top: 56%;
  border-radius: 8px;
  background-position: top center;
  background-size: cover;
  background-repeat: no-repeat;
}
 .tweet-gallery {
  display: grid;
  gap: 5px 5px;
  overflow: hidden;
  border-radius: 8px;
}
 .tweet-gallery .tweet-image {
  border-radius: 0;
}
 .tweet-gallery-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'p1';
}
 .tweet-gallery-2 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'p1 p2';
}
.tweet-gallery-2 .tweet-image {
  padding-top: 100%;
}
 .tweet-gallery-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-areas: 'p1 p2' 'p3 p4';
}
 .tweet-gallery-4 .tweet-image {
  padding-top: 56%;
}
 .tweet-gallery-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-areas: 'p1 p2' 'p1 p3';
}
 .tweet-gallery-3 .tweet-image:nth-child(1) {
  grid-area: p1;
  padding-top: 56%;
}
 .tweet-gallery-3 .tweet-image:nth-child(2) {
  grid-area: p2;
}
 .tweet-gallery-3 .tweet-image:nth-child(3) {
  grid-area: p3;
}
 .tweet-gallery-3 .tweet-image:nth-child(2), .tweet-gallery-3 .tweet-image:nth-child(3) {
  padding-top: 56%;
}
.tweet-media {
  margin-top: 6px;
}
.tweet.is-detail .tweet-media {
  margin-top: 20px;
}
 .tweet-status {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  position: absolute;
  top: -20px;
  left: -15px;
}
 .tweet-status svg {
  height: 9px;
  width: 10px;
  margin-right: 5px;
}
 .tweet-reply-to {
  font-size: 0.8rem;
  transform: translateY(-12px);
}
 
 .tweet-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 50px)
}
 .tweet-header {
  display: flex;
  flex-direction: row;
  height: 32px;
  align-items: center;
  justify-content: space-between;
  color: #aaa;
  position: relative;
  margin-bottom: 0;
  font-size: 1rem;
}
.tweet.is-detail > .tweet-content > .tweet-header {
  margin-bottom: 20px;
}
.tweet-header.is-replying .tweet-names {
  transform: translateY(-8px);
}
.tweet-header a {
  color: #aaa;
  text-decoration: none;
  padding: 0;
  margin: 0;

}
 .tweet-names {
  display: flex;
  flex: 1;
  flex-direction: row;
  max-width: calc(100vw - 160px);
}
.tweet.tweet.is-detail > .tweet-content > .tweet-header > .tweet-names {
  max-width: calc(100vw - 100px);
}
 .tweet-name {
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tweet-name a {
  color: #000 !important;
  font-weight: 600;
}
.tweet-action {
  color: #999;
  text-decoration: none;
}
.tweet-action ion-icon {
  color: #999;
}
 .tweet-text {
  font-size: 1rem;
}
.tweet.is-detail .tweet-text {
  font-size: 1.2rem;
}
 .tweet-text a {
  text-decoration: none;
  color: var(--ion-color-primary);
}
 .tweet-user {
  flex-shrink: 1;
  margin-left: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 .tweet-time {
  min-width: 50px;
  text-align: right;
  flex: 1;
}
.tweet-actions {
  display: flex;
  flex-direction: row;
  margin-top: 15px;
  /* width: calc(100% + 50px); */
  justify-content: space-between;
  /* margin-left: -50px; */
}
.tweet.is-private .tweet-actions {
  justify-content: space-around;
}
.tweet-action {
  display: flex;
  align-items: center;
  flex-direction: row;
  font-size: 1rem;
}
 .tweet-action svg {
  margin-right: 10px;
}
 .tweet-action.is-private {
  position: relative;
}
 .tweet-action.is-private::after {
  position: absolute;
  width: 10px;
  height: 13px;
  background: url(/assets/lock.svg) no-repeat 50% 50%;
  background-size: 100% auto;
  bottom: 0;
  left: 10px;
  display: block;
  content: '';
}
 .tweet-action.is-active,
.tweet-action.is-active ion-icon {
  color: green;
}
.tweet-action ion-icon {
  margin-right: 5px;
}
.tweet-action-favorite.is-active,
.tweet-action-favorite.is-active ion-icon {
  color: red;
}
.tweet.is-quote {
  padding: 10px;
  border: solid 1px #ccc;
  border-radius: 8px;
  margin-top: 10px;
}
.tweet.is-quote .tweet-content,
.tweet.is-detail .tweet-content {
  max-width: 100%;
}
.tweet.is-quote .tweet-header {
  height: 24px;
  font-size: 0.8rem;
}
.tweet.is-quote .tweet-text > .tweet-media {
  margin-left: -11px;
  margin-right: -11px;
  margin-bottom: -11px;
  width: calc(100% + 22px);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
}
 .tweet.is-quote .tweet-text {
  font-size: 0.8rem;
}
 .tweet.is-quote .tweet-names {
  max-width: calc(100vw - 160px - 62px);
}
 
</style>
