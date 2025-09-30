import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
    route("/api/dismiss-feature", "routes/api.dismiss-feature.tsx"),
    route("/", "routes/login.tsx"),
    route("/logout", "routes/logout.tsx"),
    layout("routes/layouts/auth-layout.tsx", [
        layout("routes/layouts/feature-layout.tsx", [
            route("/dashboard", "routes/dashboard.tsx"),
        ]),
        layout("routes/layouts/admin-layout.tsx", [
            route("/admin", "routes/admin.tsx"),
            route("/admin/users", "routes/admin.users.tsx"),
            route("/admin/features", "routes/admin.features.tsx"),
        ]),
    ])
] satisfies RouteConfig;
