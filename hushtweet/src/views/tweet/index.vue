<template>
  <ion-page style="background: #fff">
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button style="display: block; background: rgba(255, 255, 255, 0.5); border-radius: 50%; width: 32px" @click="$router.back()">
            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" style="width: 28px; height: 28px; color: #000">
              <polyline points="244 400 100 256 244 112" style="fill:none;stroke:currentColor;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></polyline>
              <line x1="120" y1="256" x2="412" y2="256" style="fill:none;stroke:currentColor;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line>
            </svg>
          </ion-button>
        </ion-buttons>
        <ion-title>
          Tweet
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div>
        <single-tweet :isDetailView="true" :value="tweet"/>
        <div style="padding-top: 15px; box-shadow: inset 0 10px 10px -10px rgba(0, 0, 0, 0.8);">
          <timeline style="height: 100vh;;" v-if="!isLoading && tweet.value" :isSearch="true" :searchQuery="`to:${tweet.value.user.screen_name}`" searchResultType="recent" :repliesTo="tweet.value.id_str">
            <div class="replies-title">&mdash; Replies &mdash;</div>
          </timeline>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<style scoped>
.replies-title {
  color: #999;
  font-size: 1rem;
  text-align: center;
  margin: 0 0 1rem;
  padding: 0 0 1rem;
  border-bottom: dashed 1px #eee;
}
</style>
<script lang="ts">
import { IonButtons, IonButton, IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router'
import useTwitter from '@/hooks/twitter';
import { ref, Ref, watch, computed, onMounted, shallowRef } from 'vue';
import { useAsyncState } from '@vueuse/core'
import SingleTweet from '@/components/tweet/index.vue'
import Timeline from '@/components/timeline/index.vue'
export default {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonContent,
    SingleTweet, Timeline
  },
  name: 'TweetPage',
  setup() {
    const route = useRoute()
    const id = computed(() => route.params.id || null)
    const { fetchSingleTweet } = useTwitter()

    const { state, ready: isReady } = useAsyncState((async () => {
      return await fetchSingleTweet(id.value)
    })(), null)

    const isLoading = computed(() => !(isReady && state.value))
    const tweet = computed(() => isReady ? state : null)

    return {
      isLoading,
      tweet
    }
  }
}
</script>