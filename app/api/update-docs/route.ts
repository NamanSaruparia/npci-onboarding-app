import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();

  const { email, uploadedDocs } = await req.json();

  await User.findOneAndUpdate(
    { email },
    { uploadedDocs },
    { new: true }
  );

  return NextResponse.json({ success: true });
}