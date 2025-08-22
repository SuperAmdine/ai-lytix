"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  const submitForm = () => {
    authClient.signUp.email(
      {
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name

        callbackURL: "/", // A URL to redirect to after the user verifies their email (optional)
      },
      {
        onRequest: (ctx) => {
          //show loading
        },
        onSuccess: (ctx) => {
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message);
        },
      }
    );
  };
  const login = () => {
    authClient.signIn.email(
      {
        email, // user email address
        password, // user password -> min 8 characters by default

        callbackURL: "/", // A URL to redirect to after the user verifies their email (optional)
      },
      {
        onRequest: (ctx) => {
          //show loading
        },
        onSuccess: (ctx) => {
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message);
        },
      }
    );
  };
  const logout = () => {
    authClient.signOut();
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex gap-5">
        <Card className="max-w-3xl ">
          <CardHeader>Sign Up</CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Label>Name</Label>
            <Input
              placeholder="name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
            <Label>Email</Label>
            <Input
              placeholder="some@email.com"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <Label>Password</Label>
            <Input
              placeholder="*****"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />

            {session?.user.name}
            <Button onClick={submitForm}>Sign UP</Button>
          </CardContent>
        </Card>
        <Card className="max-w-3xl ">
          <CardHeader>Sign In</CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Label>Email</Label>
            <Input
              placeholder="some@email.com"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <Label>Password</Label>
            <Input
              placeholder="*****"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />

            <Button onClick={login}>Sign IN</Button>
          </CardContent>
        </Card>
      </div>
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
