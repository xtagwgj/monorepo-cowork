import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import uiPlugin from "@cowork/ui";
import "./style.css";

createApp(App).use(createPinia()).use(router).use(uiPlugin).mount("#app");
