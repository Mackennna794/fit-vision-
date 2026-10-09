import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = body.apiKey || req.headers.get("x-api-key") || "";

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, message: "API key is required" },
        { status: 400 }
      );
    }

    // Accepts production keys matching fv_live_... or demo hackathon key
    if (apiKey.startsWith("fv_live_") || apiKey.startsWith("fv_test_") || apiKey === "fv_demo_key_2026") {
      return NextResponse.json({
        valid: true,
        tier: "Enterprise Tier",
        organization: "AuraMart Luxury Retail",
        apiKey,
        permissions: ["ar_tryon", "3d_studio", "ml_fitting", "analytics"],
        connectedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { valid: false, message: "Invalid FitVision API key prefix. Key must begin with fv_live_" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[VerifyKey] Error processing request:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error during key verification" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("api_key") || "";
  if (apiKey.startsWith("fv_live_") || apiKey === "fv_demo_key_2026") {
    return NextResponse.json({ valid: true, tier: "Enterprise Tier", apiKey });
  }
  return NextResponse.json({ valid: false, message: "Invalid API key" }, { status: 401 });
}
