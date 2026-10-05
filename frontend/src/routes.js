// Route modules, shared by the lazy routes (App.jsx) and the idle preloader (DashboardLayout.jsx)
export const PAGE_IMPORTS = {
  Dashboard: () => import("./pages/Dashboard"),
  Reviews: () => import("./pages/Reviews"),
  Analytics: () => import("./pages/Analytics"),
  Properties: () => import("./pages/Properties"),
  Assistant: () => import("./pages/Assistant"),
}
