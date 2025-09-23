import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/login.tsx"),
    route("/logout", "routes/logout.tsx"),
    layout("routes/layouts/auth-layout.tsx", [
        route("/dashboard", "routes/dashboard.tsx"),
        layout("routes/layouts/admin-layout.tsx", [
            route("/admin", "routes/admin.tsx"),
        ]),
    ])
] satisfies RouteConfig;
