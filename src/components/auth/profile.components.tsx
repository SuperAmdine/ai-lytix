"use client";

import { session } from "@/db/auth-schema";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent } from "../ui/card";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function UserProfile() {
  const router = useRouter();
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();
  const logout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/sign-in"),
      },
    });
  };
  return (
    <div>
      {session && (
        <Card>
          <CardHeader>{session.user.name}</CardHeader>
          <CardContent>
            <Button onClick={logout}>Logout</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
