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
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message:
          responseText ||
          "Backend returned an invalid response.",
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Crop recommendation proxy error:",
      error
    );

    return NextResponse.json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      cause:
        error instanceof Error && error.cause
          ? String(error.cause)
          : null,
    });
  }
}