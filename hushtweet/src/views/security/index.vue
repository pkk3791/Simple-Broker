<template>
  <ion-page>
    <main-tabs>
      <ion-header translucent>
        <ion-toolbar>
          <ion-title>Security</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content fullscreen>
        <div style="margin: 1rem">
          <strong>Public key</strong>
          <textarea readonly v-model="publicKey"></textarea>
          <strong>Private key</strong>
          <textarea readonly v-model="privateKey"></textarea>
          <ion-button :disabled="generating" @click="generateNewPair" expand="full">Generate new key pair</ion-button>
        </div>
      </ion-content>
    </main-tabs>
  </ion-page>
</template>
<style scoped>
.type-segment {
  border-radius: 0;
}
strong {
  display: block;
  margin: 1rem 0 0;
}
textarea {
  width: calc(100%);
  margin: 1rem 0 0;
  resize: none;
  border: solid 1px #999;
  height: 20vh;
  outline: none;
  padding: 1rem;
  border-radius: 4px;
}
</style>
<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import MainTabs from '@/components/main-tabs/index.vue'
import useCrypto from '@/secure/crypto'
import { useAsyncState } from '@vueuse/core'
import Storage from '@/utils/storage'
import { ref } from 'vue'
export default  {
  name: 'Security',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage, IonButton, MainTabs },
  setup() {
    const { ensureKeys } = useCrypto()
    const publicKey: any = ref(null)
    const privateKey: any = ref(null)
    const generating = ref(false)
    const { ready } = useAsyncState((async () => {
      await ensureKeys()
      publicKey.value = await Storage.getItem("publicKey");
      privateKey.value = await Storage.getItem("privateKey");
    })(), null)
    return {
      ready,
      generating,
      publicKey,
      privateKey,
      generateNewPair: async () => {
        generating.value = true
        await Storage.removeItem('publicKey')
        await Storage.removeItem('privateKey')
        await ensureKeys()
        publicKey.value = await Storage.getItem("publicKey");
        privateKey.value = await Storage.getItem("privateKey");
        generating.value = false
      }
    }
  }
}
</script>