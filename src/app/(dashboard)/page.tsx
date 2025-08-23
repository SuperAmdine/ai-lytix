import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/profile.components";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";
import Image from "next/image";
import { IconBackslash, IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      <PageNavigationBar />
      <PageContainer>
        <PageContainerHeader>
          <PageContainerHeaderTitle>Workspaces</PageContainerHeaderTitle>
          <PageContainerHeaderMoreActions>
            <Button size="sm" variant="outline" className="text-xs">
              Secondary action
            </Button>
          </PageContainerHeaderMoreActions>
        </PageContainerHeader>
        <PageContainerContent>Dashboard Home Page</PageContainerContent>
      </PageContainer>
    </>
  );
}
export const PageNavigationBar = async () => {
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
export const PageContainer = ({ children }: React.ComponentProps<"div">) => {
  return (
    <main className="fixed bottom-2 left-2 right-2 top-13 ">
      <div className="absolute top-0 left-0 peer-[button]:left-11 right-0 bottom-0 bg-white rounded-2xl border-gray-200 border flex flex-col peer-[.is-chat-open]:left-64 duration-300">
        {children}
      </div>
    </main>
  );
};

export const PageContainerHeader = ({
  children,
}: React.ComponentProps<"div">) => {
  return (
    <div className="w-full p-2 border-b  flex items-center gap-3 border-b-gray-50">
      {children}
    </div>
  );
};
export const PageContainerHeaderTitle = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="ml-3 font-sm font-medium">{children}</div>;
};
export const PageContainerHeaderMoreActions = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="ml-auto flex gap-2">{children}</div>;
};
export const PageContainerContent = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="flex-1 overflow-scroll p-5">{children}</div>;
};
/*
<div className="w-full p-2 border-b  flex items-center gap-3 border-b-gray-50">
            <div className="ml-3 font-sm font-normal">
              My New Report
              <span className="text-muted-foreground text-xs ml-4">
                #0193-849174-3918
              </span>
            </div>
              <DropdownMenuDemo /> 
            <div className="ml-auto flex gap-2">
              <Button className="text-sm" size="sm" variant="outline">
                <SaveIcon />
                Save
              </Button>

              <Button className="text-sm" size="sm" variant="outline">
                <SaveIcon />
                Export
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-scroll">{children}</div>
          */
