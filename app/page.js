import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TradeJournal from "./dashboard/page";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?message=noaccount");
  }

  return (
      <>
         <TradeJournal />
      </>
  );
}