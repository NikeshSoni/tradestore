import { auth } from "@clerk/nextjs/server";

export default function Dashboard() {
  const { userId } = auth();

  if (!userId) return <div>You are not logged in.</div>;

  return <div>Welcome to Dashboard</div>;
}
