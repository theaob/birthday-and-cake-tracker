import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO } from 'date-fns';

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { birthday: 'asc' },
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, birthday, cakeBought } = body;

    if (!name || !birthday) {
      return NextResponse.json({ error: 'Name and birthday are required' }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        name,
        birthday: parseISO(birthday), // Ensure we parse the incoming ISO string
        cakeBought: cakeBought || false,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
