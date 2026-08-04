import type { Route } from "./+types/auth.oauth";
import { redirect } from "react-router";
import { randomBytes } from "crypto";
import { OAuthService } from "~/services/oauthService";

export async function loader({ context }: Route.LoaderArgs) {
  const config = await OAuthService.getConfig();

  if (!config || !config.enabled) {
    return redirect("/");
  }

  const state = randomBytes(32).toString("hex");
  context.session.oauthState = state;

  await new Promise<void>((resolve, reject) => {
    context.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const authorizationUrl = OAuthService.buildAuthorizationUrl(config, state);
    return redirect(authorizationUrl);
  } catch (error) {
    console.error("Error building OAuth authorization URL:", error);
    return redirect("/?error=oauth");
  }
}
