<template>
  <ion-avatar :class="{ 'tweet-avatar': true, 'is-quote': isQuote, 'is-large': isLarge }">
    <ion-skeleton-text animated v-if="isLoading" circle="circle" height="32px"></ion-skeleton-text>
    <router-link v-else-if="!readonly" :to="`/profile/@${user.screen_name}`" style="display: block; overflow: hidden; height: 100%; width: 100%; border-radius: 50%">
      <img :src="user.profile_image_url_https" />
    </router-link>
    <img v-else :src="user.profile_image_url_https" />
    <svg class="tweet-verified" v-if="!isLoading && user.verified" viewBox="0 0 24 24">
      <g>
        <path fill="#1DA1F2" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
      </g>
    </svg>
  </ion-avatar>
</template>
<script lang="ts">
import { IonAvatar, IonSkeletonText } from '@ionic/vue';
export default {
  props: {
    isQuote: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    isLarge: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: null
    }
  },
  components: {
    IonAvatar,
    IonSkeletonText
  }
}
</script>
<style scoped>
.tweet-avatar {
  width: 32px;
  min-width: 32px;
  height: 32px;
  margin-right: 15px;
  position: relative;
}
.tweet-avatar.is-large {
  width: 48px;
  min-width: 48px;
  height: 48px;
  margin-right: 15px;
  position: relative;
}
.tweet-avatar.is-quote {
  width: 1rem;
  min-width: 1rem;
  height: 1rem;
  margin-right: 10px;
}
.tweet-verified {
  width: 16px;
  height: 16px;
  position: absolute;
  right: -4px;
  bottom: -4px;
  background: #fff;
  border-radius: 50%;
}
.tweet-avatar.is-quote .tweet-verified {
  width: 8px;
  height: 8px;
  right: -2px;
  bottom: -2px;
}
</style>