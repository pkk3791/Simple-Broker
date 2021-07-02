<template>
  <ion-page>
    <main-tabs>
      <ion-header translucent>
        <ion-toolbar>
          <ion-title>Blocked users</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content fullscreen>
        <people type="blocks" />
      </ion-content>
    </main-tabs>
  </ion-page>
</template>
<style scoped>
.type-segment {
  border-radius: 0;
}
</style>
<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import MainTabs from '@/components/main-tabs/index.vue'
import People from '@/components/people/index.vue'
export default  {
  name: 'Blocked',
  components: { People, IonHeader, IonToolbar, IonTitle, IonContent, IonPage, MainTabs }
}
</script>