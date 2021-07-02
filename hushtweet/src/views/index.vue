<template>
  <ion-page>
    <main-tabs selectedTab="home" @tweeted="onTweeted">
      <ion-content :fullscreen="true">
        <timeline ref="lstTweets" :includeReplies="true"></timeline>
      </ion-content>
    </main-tabs>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonContent, modalController, IonFab, IonFabButton, IonIcon } from '@ionic/vue';
import MainTabs from '@/components/main-tabs/index.vue'
import Timeline from '@/components/timeline/index.vue'
import CreateTweetPage from '@/views/tweet/create.vue'
import { pencilOutline } from 'ionicons/icons';
import { ref, computed } from 'vue'
export default  {
  name: 'Tab1',
  components: { IonContent, IonPage, Timeline, MainTabs },
  setup() {
    const lstTweets: any = ref(null)
    return {
      lstTweets,
      onTweeted() {
        if (lstTweets.value) {
          lstTweets.value.doRefresh()
        }
      }
    }
  }
}
</script>