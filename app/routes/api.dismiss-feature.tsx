import type { Route } from "./+types/api.dismiss-feature";
import { redirect } from "react-router";
import { NewFeatureService } from "~/services/newFeatureService";

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  try {
    const { csrfToken, featureId } = await request.json();

    if (featureId) {
      await NewFeatureService.dismissFeature(user.id, parseInt(featureId));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error dismissing feature:", error);
    return new Response(JSON.stringify({ error: "Failed to dismiss feature" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// This route doesn't render anything, it just handles API actions
export default function ApiDismissFeature() {
  return null;
}