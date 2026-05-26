export function isNavItemActive(path: string, currentPath: string): boolean {
  if (path === "/" || path === "/dashboard") return currentPath === path;
  return currentPath.startsWith(path);
}
