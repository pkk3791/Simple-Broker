<template>
  <ion-page>
    <ion-content class="ion-text-center" :fullscreen="true" :scroll-y="false">
      <section class="ion-padding auth-content">
        <logo class="animate__animated animate__pulse"/>
        <div v-if="isBusy" class="hush-spinner animate__animated animate__faster animate__fadeInUp"></div>
        <ion-button v-else @click="login" class="auth-btn animate__animated animate__faster animate__fadeInUp" expand="block" color="primary">
          <ion-icon slot="start" :icon="logoTwitter"></ion-icon>
          Login with Twitter
        </ion-button>
      </section>
    </ion-content>
  </ion-page>
</template>
<style scoped>
.auth-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background: url(/assets/backgrounds/splash-bg.svg) no-repeat bottom center;
  background-size: 100% auto;
}
.auth-btn {
  width: 250px;
}
</style>
<script lang="ts">
  import {
    ref
  } from 'vue'
import { logoTwitter } from 'ionicons/icons';
import { IonPage, IonContent, IonButton, IonIcon, toastController, menuController } from '@ionic/vue';
import Logo from '@/components/logo/index.vue';
import useFirebaseAuth from "@/hooks/firebase";
import { useRouter } from 'vue-router';
export default  {
  name: 'AuthPage',
  components: { IonContent, IonPage, IonIcon, IonButton, Logo },
  setup() {
    const { login } = useFirebaseAuth();
    const router = useRouter();
    const isBusy = ref<boolean>(false);
    return {
      logoTwitter,
      isBusy,
      login: async () => {
        try {
          isBusy.value = true
          const result = await login()
          if (result) {
            router.replace('/')
            isBusy.value = false
            menuController.enable(true, 'menu');
          }
        } catch (ex) {
          isBusy.value = false
          console.log(ex)
          const toast = await toastController
            .create({
              message: ex.message,
              duration: 5000,
              color: 'danger'
            })
          toast.present();
        }
      }
    }
  }
}
</script>