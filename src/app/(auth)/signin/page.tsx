"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SigninPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="max-w-3xl ">
        <CardHeader>Signin</CardHeader>
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

          <Button>Sign IN</Button>
        </CardContent>
      </Card>
    </div>
  );
}
