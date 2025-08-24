import { getSession } from "@/lib/get-session";
import { Link } from "lucide-react";
import { redirect } from "next/navigation";
import { UserProfile } from "./auth/profile.components";
import { Button } from "./ui/button";
import Image from "next/image";

export const NavigationBar = async () => {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <header className="fixed top h-13 items-center flex  w-full px-3 justify-between">
      <div className="flex gap-3 items-center flex-row w-fit">
        {/*  */}
        <div className="flex gap-1 items-center">
          <Image
            src={"/logo-296.svg"}
            alt="logo"
            width={30}
            height={30}
            className="size-7"
          />
          <div>
            <span className="font-bold">ai</span>
            <span className="font-bols">nalytic</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {/* <DropdownProfile data={me} /> */}
        <Button className="" variant="link" size="sm" asChild>
          <Link href="/">Workspaces</Link>
        </Button>
        <UserProfile
          name={session.user.name}
          email={session.user.email}
          image={session.user.image || undefined}
        />
      </div>
    </header>
  );
};
