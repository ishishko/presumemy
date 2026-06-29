import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupPinia } from './pinia'
import './styles/main.css'

const app = createApp(App)
setupPinia(app)
app.use(router)
app.mount('#app')
