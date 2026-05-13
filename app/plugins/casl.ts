import { abilitiesPlugin } from "@casl/vue";
import { AppAbility, detectSubjectType } from "~/utils/casl/ability";

export default defineNuxtPlugin((nuxtApp) => {
  const ability = new AppAbility([], { detectSubjectType });
  nuxtApp.vueApp.use(abilitiesPlugin, ability);
});
