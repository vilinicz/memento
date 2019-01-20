import Vue from 'vue';

import './reset.css';

const isProduction = process.env.NODE_ENV === 'production';

Vue.config.productionTip = false;
Vue.config.silent = isProduction;
