import { db } from "@/db";
import { session, user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function TestPage() {
  const authsession = auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  //   await headers();
  const users = await db.select().from(user);
  const manualsessions = await db
    .select()
    .from(session)
    .where(eq(session.userId, "PcS1v9pSgHSEgbJV7aGGLSVCvORLcYg0"));
  //   const users2 = await db.query.user.findMany({ where: eq(user.id, "1") });

  return (
    <div>
      I am a Page
      <pre>{JSON.stringify(users, null, 4)}</pre>
      <pre>{JSON.stringify(manualsessions, null, 4)}</pre>
    </div>
  );
}
