import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/profile.components";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session) {
    redirect("/sign-in");
  }
  return (
    <div>
      <UserProfile />
    </div>
  );
}
