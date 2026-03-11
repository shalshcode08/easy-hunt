import { redirect } from "next/navigation";
import AuthClient from "./_auth";

export default function AuthPage() {
  // if (process.env.NODE_ENV === "development") redirect("/feed");
  return <AuthClient />;
}
