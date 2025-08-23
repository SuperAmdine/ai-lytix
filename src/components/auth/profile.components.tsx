"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconLogout,
  IconDiamond,
  IconSettings,
  IconHelp,
} from "@tabler/icons-react";
export function UserProfile({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string;
}) {
  const router = useRouter();

  const logout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/sign-in"),
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* <IconUser /> */}
        {/* <img src={data.avatar_url} /> */}
        <Avatar className="size-7">
          <AvatarImage src={image || undefined} />
          <AvatarFallback className="uppercase">
            {name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-2" align="start">
        <DropdownMenuLabel className="flex flex-col">
          <span>{name}</span>
          <span className="font-normal text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconDiamond />
            Upgrade Plan
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconSettings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconHelp />
          Help
        </DropdownMenuItem>

        <DropdownMenuItem onClick={logout}>
          <IconLogout /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
