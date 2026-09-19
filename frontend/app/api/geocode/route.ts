import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  "https://smart-agriculture-backend-cpuf.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const state = searchParams.get("state");
    const district = searchParams.get("district");

    if (!state || !district) {
      return NextResponse.json(
        {
          message:
            "State and district are required.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/geocode?state=${encodeURIComponent(
        state
      )}&district=${encodeURIComponent(
        district
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

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
      "Geocode proxy error:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to backend.",
      },
      { status: 500 }
    );
  }
}