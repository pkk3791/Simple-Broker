<template>
  <ion-tabs class="main-tabs">
    <slot></slot>
    <ion-tab-bar slot="bottom" :selectedTab="selectedTab">
      <ion-tab-button tab="home" href="#" @click.prevent="switchTab('feed')">
        <ion-icon :icon="homeOutline" />
      </ion-tab-button>
        
      <ion-tab-button tab="search" href="#" @click.prevent="switchTab('search')">
        <ion-icon :icon="searchOutline" />
      </ion-tab-button>
        
      <ion-tab-button tab="mail" href="#" @click.prevent="switchTab('mail')">
        <ion-icon :icon="mailOutline" />
      </ion-tab-button>
      
      <ion-tab-button style="margin-left: 20%" tab="menu" href="#" @click.prevent="openMenu">
        <ion-icon :icon="menuOutline" />
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
  <ion-fab style="margin-right: 20%" vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="writeTweet">
      <ion-icon :icon="pencilOutline"></ion-icon>
    </ion-fab-button>
  </ion-fab>
</template>
<style>
.main-tabs .tabs-inner {
  display: none;
}
</style>
<style scoped>
ion-tab-bar {
  --background: #F2F2F2;
  height: 60px;
}
ion-tab-bar ion-icon {
  font-size: 28px;
}
ion-tab-bar ion-tab-button {
  position: relative;
}
ion-tab-bar ion-tab-button.tab-selected::after {
  width: 100%;
  height: 7px;
  background: linear-gradient(90deg, #FFC58D 0%, #E57CED 100%);
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}
</style>
<script lang="ts">
import { IonTabBar, IonFab, IonFabButton, IonTabButton, IonTabs, IonIcon, modalController, menuController } from '@ionic/vue';
import { homeOutline, searchOutline, menuOutline, mailOutline } from 'ionicons/icons';
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { pencilOutline } from 'ionicons/icons';
import CreateTweetPage from '@/views/tweet/create.vue'
import useTweetUI from '@/hooks/tweetUI'
export default  {
  components: { IonTabs, IonTabBar, IonTabButton, IonIcon, IonFab, IonFabButton },
  props: {
    selectedTab: {
      type: String,
      default: null
    }
  },
  setup(props, { emit }) {
    const router = useRouter()
    const { writeTweet } = useTweetUI()
    const tabs: any = ref(null)
    return {
      pencilOutline,
      homeOutline,
      searchOutline,
      menuOutline,
      mailOutline,
      openMenu() {
        menuController.enable(true, 'menu');
        menuController.open('menu');
        return false
      },
      writeTweet: async () => {
        await writeTweet()
        emit('tweeted')
      },
      switchTab(target) {
        tabs.value?.select(target)
        router.replace({
          name: target
        })
      }
    }
  }
}
</script>