import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),
  layout("./dashboard/layout.tsx", [
    route("dashboard", "./dashboard/index.tsx"),
  ]),
] satisfies RouteConfig;
