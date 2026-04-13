import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { email } = await req.json();

  const user = await User.findOne({ email });

  return Response.json({ user });
}