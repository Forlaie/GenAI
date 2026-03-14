import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('artisland');
    const characters = await db
      .collection('characters')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(characters.map(char => ({
      id: char._id.toString(),
      imageUrl: char.imageUrl,
      name: char.name,
      age: char.age,
      position: char.position,
    })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('artisland');

    const character = {
      name: body.name,
      age: body.age,
      imageUrl: body.imageUrl,
      position: body.position,
      createdAt: new Date(),
    };

    const result = await db.collection('characters').insertOne(character);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...character,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save character' }, { status: 500 });
  }
}