import { abilitiesPlugin } from '@casl/vue';
import { AppAbility } from '~/utils/casl/ability';

export default defineNuxtPlugin((nuxtApp) => {
  const ability = new AppAbility([]);
  nuxtApp.vueApp.use(abilitiesPlugin, ability, { useGlobalGuard: false });
});
