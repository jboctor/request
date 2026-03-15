import { useRouteLoaderData } from "react-router";

export function CsrfInput() {
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };
  return <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />;
}
