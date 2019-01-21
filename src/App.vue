<template>
  <div class="App">
    <video
      ref="video"
      autoplay
      muted
      hidden
      @play="detect"
    />

    <div
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

export default {
  name: 'App',

  data() {
    return {
      ssdMobilenetv1Options: {
        minConfidence: 0.5, // 0.5
        maxResults: 5, // 5
      },
      tinyFaceDetectorOptions: {
        inputSize: 512, // 512
        scoreThreshold: 0.5, // 0.5
      },

      // При экспериментах, не забыть поменять загрузку!
      options: new faceapi.SsdMobilenetv1Options(this.ssdMobilenetv1Options),
      // options: new faceapi.TinyFaceDetectorOptions(this.tinyFaceDetectorOptions),

      constraints: {
        audio: false,
        video: {
          frameRate: {
            ideal: 10,
            max: 15,
          },
        },
      },

      timeout: 1000 / 15,
    };
  },

  async mounted() {
    const modelUri = '/models';

    // Точнее, но медленнее.
    await faceapi.loadSsdMobilenetv1Model(modelUri);
    // await faceapi.loadTinyFaceDetectorModel(modelUri);

    await faceapi.loadFaceLandmarkModel(modelUri);
    await faceapi.loadFaceRecognitionModel(modelUri);

    this.$refs.video.srcObject = await navigator.mediaDevices.getUserMedia(this.constraints);
  },

  methods: {
    async detect() {
      const results = await faceapi.detectAllFaces(this.$refs.video, this.options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (results.length > 0) {
        this.collectDescriptors(results);
      }

      setTimeout(this.detect, this.timeout);
    },

    // todo хитрый сохранятор.
    //  искать пришедший в тех, что уже есть и что то делать.
    //  обновлять пришедший, который уже есть.
    collectDescriptors(results) {
      const descriptors = results.map(result => result.descriptor);
      localStorage.setItem('descriptors', descriptors);
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
