import { connectDB } from "@/app/lib/mongodb";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, selectedItems, selectedCardVariant, bankName } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedItems)) {
      return Response.json(
        { message: "selectedItems must be an array." },
        { status: 400 }
      );
    }

    const cardVariant = String(selectedCardVariant ?? "").trim();
    const bank = String(bankName ?? "").trim();

    const user = await User.findOneAndUpdate(
      { mobile: cleanMobile },
      {
        $set: {
          onboardingKit: selectedItems,
          onboardingKitDetails: {
            selectedCardVariant: cardVariant,
            bankName: bank,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    return Response.json({
      success: true,
      onboardingKit: user.onboardingKit,
      onboardingKitDetails: user.onboardingKitDetails,
    });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
