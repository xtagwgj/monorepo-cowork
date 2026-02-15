import { createRouter, createWebHistory } from "vue-router";

const Home = { template: "<p>Home route is active.</p>" };
const About = { template: "<p>About route is active.</p>" };

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/about", component: About }
  ]
});

export default router;
