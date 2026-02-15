import type { App } from "vue";
import CowButton from "./components/CowButton.vue";

export { CowButton };

export default {
  install(app: App) {
    app.component("CowButton", CowButton);
  }
};
