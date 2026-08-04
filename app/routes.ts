import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/login.tsx"),
    route("/logout", "routes/logout.tsx"),
    route("/contact", "routes/contact.tsx"),
    route("/verify-email", "routes/verify-email.tsx"),
    route("/auth/oauth", "routes/auth.oauth.tsx"),
    route("/auth/oauth/callback", "routes/auth.oauth-callback.tsx"),
    layout("routes/layouts/auth-layout.tsx", [
        route("/api/dismiss-feature", "routes/api.dismiss-feature.tsx"),
        route("/api/media-search", "routes/api.media-search.tsx"),
        route("/api/recommendations", "routes/api.recommendations.tsx"),
        layout("routes/layouts/feature-layout.tsx", [
            route("/dashboard", "routes/dashboard.tsx"),
            route("/settings", "routes/settings.tsx"),
        ]),
        layout("routes/layouts/admin-layout.tsx", [
            route("/admin", "routes/admin.tsx"),
            route("/admin/users", "routes/admin.users.tsx"),
            route("/admin/features", "routes/admin.features.tsx"),
            route("/admin/oauth", "routes/admin.oauth.tsx"),
        ]),
    ])
] satisfies RouteConfig;
