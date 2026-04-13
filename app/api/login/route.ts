import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { email, password } = await req.json();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      password,
      uploadedDocs: 0,
    });
  }

  return Response.json({ user });
}