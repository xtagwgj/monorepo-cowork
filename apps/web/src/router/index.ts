import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("../views/HomeView.vue") },
    { path: "/about", component: () => import("../views/AboutView.vue") },
    { path: "/chat-virtual", component: () => import("../views/ChatVirtualListView.vue") }
  ]
});

export default router;
