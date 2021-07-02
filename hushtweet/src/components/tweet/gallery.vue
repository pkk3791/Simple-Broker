<template>
  <ion-content :fullscreen="true" :scroll-y="false">
    <div class="actions">
      <ion-button size="large" fill="clear" @click="closePopup">
        <ion-icon  @click="closePopup" :icon="closeOutline" slot="start" />
      </ion-button>
    </div>
    <ion-slides ref="slider" @ionSlidesDidLoad="onIonSlidesDidLoad" :options="sliderOptions" pager="true" style="height: 100%; z-index: 0">
      <ion-slide v-for="image in images" :key="image.media_url_https">
        <!-- <div class="swiper-zoom-container"> -->
          <img :src="image.media_url_https" />
        <!-- </div> -->
      </ion-slide>
    </ion-slides>
  </ion-content>
</template>
<style scoped>
ion-content {
  --background: #000;
}
.actions {
  position: absolute;
  text-align: right;
  width: 100%;
  z-index: 1;
}
.actions ion-button {
  --color: #fff;
}
.actions ion-icon {
  margin: 0;
}
</style>
<script lang="ts">
import { IonContent, IonSlides, IonSlide, IonButton, IonIcon } from '@ionic/vue';
import { defineComponent, ref } from 'vue';
  import {
    closeOutline
  } from 'ionicons/icons';
export default defineComponent({
  name: 'Gallery',
  props: {
    images: {
      type: Array,
      default: () => []
    },
    activeSlide: {
      type: Number,
      default: 0
    },
    closeHandler: {
      type: Function,
      default: null
    }
  },
  components: { IonContent, IonSlides, IonSlide, IonButton, IonIcon },
  setup(props) {
    const swiper: any = ref(null)
    return {
      closeOutline,
      sliderOptions: {
        initialSlide: props.activeSlide
      },
      onIonSlidesDidLoad(evt) {
        swiper.value = evt.target.swiper
        console.log(evt)
      },
      async closePopup() {
        swiper.value.destroy(true, true)
        if (props.closeHandler) props.closeHandler()
      }
    }
  }
});
</script>