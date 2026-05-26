import type { NavMenuGroup, NavMenuItem } from "~/types/navigation";
import { isNavItemActive } from "~/utils/navigation";

const DASHBOARD_TITLE_RULES: { test: (path: string) => boolean; title: string }[] =
  [
    { test: (p) => p === "/dashboard", title: "儀表板" },
    { test: (p) => /^\/dashboard\/members\/create/.test(p), title: "新增會友" },
    { test: (p) => /^\/dashboard\/members\/edit/.test(p), title: "編輯會友" },
    { test: (p) => p.startsWith("/dashboard/members"), title: "會友管理" },
    { test: (p) => p.startsWith("/dashboard/organization"), title: "組織架構" },
    { test: (p) => /^\/dashboard\/roles\/create/.test(p), title: "新增角色" },
    { test: (p) => /^\/dashboard\/roles\/edit/.test(p), title: "編輯角色" },
    { test: (p) => p.startsWith("/dashboard/roles"), title: "角色管理" },
    {
      test: (p) => p.startsWith("/dashboard/courses/templates/create"),
      title: "建立課程模板",
    },
    {
      test: (p) =>
        /^\/dashboard\/courses\/templates\/[^/]+$/.test(p) &&
        !p.endsWith("/create"),
      title: "編輯課程模板",
    },
    {
      test: (p) => p.startsWith("/dashboard/courses/templates"),
      title: "課程模板",
    },
    {
      test: (p) => p.startsWith("/dashboard/courses/classes/create"),
      title: "建立班級",
    },
    {
      test: (p) => /^\/dashboard\/courses\/classes\/[^/]+/.test(p),
      title: "班級詳情",
    },
    {
      test: (p) => p.startsWith("/dashboard/courses/classes"),
      title: "班級管理",
    },
  ];

export function resolveDashboardPageTitle(path: string): string {
  return DASHBOARD_TITLE_RULES.find((rule) => rule.test(path))?.title ?? "內行管理系統";
}

export function isDashboardNavActive(path: string, currentPath: string): boolean {
  return isNavItemActive(path, currentPath);
}

export function useDashboardNavigation() {
  const auth = useAuth();
  const route = useRoute();
  const titleOverride = useState<string | null>(
    "dashboard-mobile-header-title",
    () => null
  );

  const menuItems = computed((): NavMenuItem[] =>
    [
      { label: "首頁", icon: "pi pi-home", to: "/dashboard", show: true },
      {
        label: "會友管理",
        icon: "pi pi-users",
        to: "/dashboard/members",
        show: auth.can("view", "Member"),
      },
      {
        label: "組織架構",
        icon: "pi pi-sitemap",
        to: "/dashboard/organization",
        show: auth.can("view", "Organization"),
      },
      {
        label: "角色管理",
        icon: "pi pi-shield",
        to: "/dashboard/roles",
        show: auth.can("manage", "System"),
      },
      {
        label: "課程管理",
        icon: "pi pi-book",
        to: "/dashboard/courses/templates",
        show: auth.can("manage", "CourseTemplate"),
      },
      {
        label: "班級管理",
        icon: "pi pi-users",
        to: "/dashboard/courses/classes",
        show: auth.can("manage", "CourseClass"),
      },
    ]
      .filter((item) => item.show)
      .map(({ label, icon, to }) => ({ label, icon, to }))
  );

  const menuGroups = computed((): NavMenuGroup[] => {
    const items = menuItems.value;
    const groups: NavMenuGroup[] = [];

    const overview = items.filter((item) => item.to === "/dashboard");
    if (overview.length) groups.push({ label: "總覽", items: overview });

    const membership = items.filter((item) =>
      ["/dashboard/members", "/dashboard/organization"].includes(item.to)
    );
    if (membership.length) {
      groups.push({ label: "會友與組織", items: membership });
    }

    const courses = items.filter((item) => item.to.includes("/courses/"));
    if (courses.length) groups.push({ label: "課程", items: courses });

    const system = items.filter((item) => item.to === "/dashboard/roles");
    if (system.length) groups.push({ label: "系統", items: system });

    return groups;
  });

  const courseSubNavItems = computed((): NavMenuItem[] =>
    [
      {
        label: "課程模板",
        icon: "pi pi-book",
        to: "/dashboard/courses/templates",
        show: auth.can("manage", "CourseTemplate"),
      },
      {
        label: "班級管理",
        icon: "pi pi-users",
        to: "/dashboard/courses/classes",
        show: auth.can("manage", "CourseClass"),
      },
    ]
      .filter((item) => item.show)
      .map(({ label, icon, to }) => ({ label, icon, to }))
  );

  const isCourseSection = computed(() =>
    route.path.startsWith("/dashboard/courses")
  );

  const pageTitle = computed(
    () => titleOverride.value ?? resolveDashboardPageTitle(route.path)
  );

  const isNavActive = (path: string): boolean =>
    isDashboardNavActive(path, route.path);

  function setPageTitle(title: string | null): void {
    titleOverride.value = title;
  }

  return {
    menuItems,
    menuGroups,
    courseSubNavItems,
    isCourseSection,
    pageTitle,
    isNavActive,
    setPageTitle,
  };
}

export function useDashboardMobileHeader(
  title?: MaybeRefOrGetter<string | null>
) {
  const { setPageTitle } = useDashboardNavigation();

  if (title !== undefined) {
    watchEffect(() => {
      setPageTitle(toValue(title));
    });

    onUnmounted(() => {
      setPageTitle(null);
    });
  }

  return { setPageTitle };
}
