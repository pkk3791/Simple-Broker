<template>
  <ion-page>
    <ion-content class="ion-padding" :scroll-y="false">
      <ion-slides ref="slider" :pager="true" @ionSlideDidChange="onSlideChanged">

        <ion-slide>
          <div class="slide">
            <img src="/assets/onboard/control.svg" />
            <div class="slide-content">
              <h2>Stay in control</h2>
              <p>
                Don't share your personal information with advertisers</p>
              <p>Switch freely between public and private atmospheres in seamless experience</p>
            </div>
          </div>
        </ion-slide>

        <ion-slide>
          <div class="slide">
            <img src="/assets/onboard/hush-tweets.svg" />
            <div class="slide-content">
              <h2>Hush Tweets</h2>
              <p>
                Express yourself privately in an encrypted, distributed world</p>
              <p>No central entity controls your data, but
                you</p>
            </div>
          </div>
        </ion-slide>

        <ion-slide>
          <div class="slide">
            <img src="/assets/onboard/likes.svg" />
            <div class="slide-content">
              <h2>Anonymous likes</h2>
              <p>
                Like tweets anonymously, leave no traces behind
              </p>
              <p>
                Say bye to creepy trackers
              </p>
            </div>
          </div>
        </ion-slide>
      </ion-slides>
      <div class="onboard-footer ion-padding-bottom">
        <ion-button v-if="isFirstSlide" size="small" fill="clear" router-link="/auth">skip</ion-button>
        <ion-button v-else size="small" fill="clear" @click="onPrevClick">
          <ion-icon slot="start" :icon="arrowBack"></ion-icon>
        </ion-button>
        <ion-button v-if="isLastSlide" size="small" fill="clear" router-link="/auth">sign in</ion-button>
        <ion-button v-else size="small" fill="clear" @click="onNextClick">
          <ion-icon slot="end" :icon="arrowForward"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
<style scoped>
  ion-slides {
    height: 100%;
  }

  .onboard-footer {
    position: absolute;
    bottom: 0;
    left: 50%;
    margin-left: -140px;
    z-index: 1;
    max-width: 280px;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .onboard-footer ion-button {
    --padding-start: 0;
    --padding-end: 0;
    transform: translateY(-2px);
  }

  .onboard-footer ion-button ion-icon {
    margin: 0;
  }

  .slide {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    height: 100%;
  }

  .slide-content {
    max-width: 280px;
    text-align: left;
    margin-top: 4rem;
  }

  .slide-content h2 {
    text-transform: uppercase;
  }

  .slide img {
    max-width: 100%;
    margin-top: 2rem;
    height: 250px;
  }
</style>
<script lang="ts">
  import {
    ref,
    computed,
    Ref,
    defineComponent
  } from 'vue'
  import {
    arrowForward,
    arrowBack
  } from 'ionicons/icons';
  import {
    IonPage,
    IonContent,
    IonSlides,
    IonSlide,
    IonButton,
    IonIcon
  } from '@ionic/vue';

  export default defineComponent({
    name: 'AuthPage',
    components: {
      IonContent,
      IonPage,
      IonSlides,
      IonSlide,
      IonButton,
      IonIcon
    },
    setup() {
      const slider: (Ref<typeof IonSlides | null>) = ref(null);
      const isFirstSlide = ref<boolean>(true);
      const isLastSlide = ref<boolean>(false);
      const onSlideChanged = async () => {
        console.log("slideChanged");
        const s = await slider?.value?.$el.getSwiper();
        const slideLength = s.slides.length;
        const activeSlide = s.activeIndex;
        isFirstSlide.value = activeSlide === 0;
        isLastSlide.value = activeSlide === slideLength - 1;
      };
      return {
        arrowForward,
        arrowBack,
        slider,
        async onNextClick() {
          slider.value?.$el.slideNext()
        },
        onPrevClick() {
          slider.value?.$el.slidePrev()
        },
        isFirstSlide,
        isLastSlide,
        onSlideChanged
      }
    }
  })
</script>