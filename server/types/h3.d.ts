import type { UserContext } from '~/types/auth';
import type { AppAbility } from '~/utils/casl/ability';

declare module 'h3' {
  interface H3EventContext {
    userId?: string;
    userContext?: UserContext;
    ability?: AppAbility;
  }
}
