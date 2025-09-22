import type { Route } from "./+types/dashboard";
import { RequestForm } from "~/dashboard/request-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "John Boctor Services" },
    { name: "description", content: "Welcome to John Boctor Services!" },
  ];
}

export default function Dashboard({ actionData, loaderData }: Route.ComponentProps) {
  return (
    <RequestForm />
  );
}
