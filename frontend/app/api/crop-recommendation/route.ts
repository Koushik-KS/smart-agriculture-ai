import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  "https://smart-agriculture-backend-cpuf.onrender.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/crop-recommendation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Crop recommendation proxy error:", error);

    return NextResponse.json(
      {
        message: "Failed to connect to crop recommendation service.",
      },
      { status: 500 }
    );
  }
}