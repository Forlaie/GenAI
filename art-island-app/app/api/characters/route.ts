import { NextResponse } from "next/server";
import { connectDB, Character } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    const characters = await Character.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(characters);
  } catch (error) {
    console.error("GET /api/characters error:", error);
    return NextResponse.json(
      { error: "Failed to load characters" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const character = await Character.create({
      name: body.name,
      age: body.age,
      image_url: body.image_url,
      position_x: body.position_x,
      position_y: body.position_y,
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error("POST /api/characters error:", error);
    return NextResponse.json(
      { error: "Failed to save character" },
      { status: 500 },
    );
  }
}
