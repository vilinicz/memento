<template>
  <div class="App">
    <video
      ref="video"
      autoplay
      hidden
      @play="detectFaces"
    />

    <div
      v-if="avgTime !== -1"
      class="stats"
    >
      <p>{{ avgTime }} ms | цель: {{ (1000 / maxFps).toFixed() }}</p>
      <p>{{ fps }} fps | цель: {{ maxFps }}</p>
    </div>

    <div
      v-if="avgTime !== -1"
      class="screenfull"
      @mousedown="enableScreenFull"
      @touchstart="enableScreenFull"
    >
      [ _ ]
    </div>
  </div>
</template>

<script>
import * as faceapi from 'face-api.js';
import screenfull from 'screenfull';

const maxFps = 15;
let forwardTimes = [];

export default {
  name: 'App',

  data() {
    return {
      maxFps,

      constraints: {
        audio: false,
        video: {
          frameRate: { max: maxFps },
          // user | environment.
          facingMode: 'user',
        },
      },

      // При экспериментах, не забыть поменять загрузку!
      // options: new faceapi.SsdMobilenetv1Options(this.ssdMobilenetv1Options),
      options: new faceapi.TinyFaceDetectorOptions(this.tinyFaceDetectorOptions),

      ssdMobilenetv1Options: {
        minConfidence: 0.5,
        maxResults: 30,
      },
      tinyFaceDetectorOptions: {
        inputSize: 160,
        scoreThreshold: 0.5,
      },

      avgTime: -1,
      fps: -1,

      timeout: 1000 / maxFps,
    };
  },

  async mounted() {
    await this.loadingModels();
    await this.getUserMedia();
  },

  methods: {
    async loadingModels() {
      const modelUri = '/models';

      // Точнее, но медленнее.
      // await faceapi.loadSsdMobilenetv1Model(modelUri);
      await faceapi.loadTinyFaceDetectorModel(modelUri);

      await faceapi.loadFaceLandmarkModel(modelUri);
      await faceapi.loadFaceRecognitionModel(modelUri);
    },

    async getUserMedia() {
      this.$refs.video.srcObject = await navigator.mediaDevices.getUserMedia(this.constraints);
    },

    async detectFaces() {
      const prevTime = performance.now();

      const results = await faceapi.detectAllFaces(this.$refs.video, this.options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      this.updateStats(prevTime);

      if (results.length > 0) {
        this.collectDescriptors(results);
      }

      setTimeout(this.detectFaces, this.timeout);
    },

    updateStats(prevTime) {
      const time = performance.now() - prevTime;
      forwardTimes = [time, ...forwardTimes].slice(0, 30);
      const avgTime = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length;

      this.avgTime = Math.round(avgTime);
      this.fps = Math.round(1000 / avgTime);
    },

    // todo хитрый сохранятор.
    //  искать пришедший в тех, что уже есть и что то делать.
    //  обновлять пришедший, который уже есть.
    collectDescriptors(results) {
      const descriptors = results.map(result => result.descriptor);
      localStorage.setItem('descriptors', descriptors);

      console.log('descriptors', descriptors);
    },

    enableScreenFull() {
      if (screenfull.enabled) {
        screenfull.request();
      }
    },
  },
};
</script>

<style
  lang="scss"
  scoped
>
.App {
  height: 100vh;
  background-color: #333;
}

.stats {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.1rem 0.5rem 0.3rem;
  border-radius: 1rem;
  font-size: 1rem;
  color: white;
  background-color: darkslategray;
}

.screenfull {
  position: absolute;
  z-index: 1;
  right: 0.5rem;
  bottom: 0.5rem;
  padding: 0.1rem 0.5rem 0.3rem;
  border-radius: 1rem;
  font-size: 1rem;
  color: white;
  background-color: brown;
  cursor: pointer;
}
</style>
