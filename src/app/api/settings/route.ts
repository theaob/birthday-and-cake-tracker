import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Auth note: this route is behind the app-wide Keycloak login enforced by
// src/middleware.ts — there's no separate password gate here anymore.

export async function GET() {
  try {
    const settings = await prisma.zulipSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    return NextResponse.json({
      ...settings,
      apiKey: settings.apiKey ? '••••••••' : '',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteUrl, botEmail, apiKey, stream, topic, enabled } = body;

    const updateData: Record<string, unknown> = {
      siteUrl: siteUrl ?? '',
      botEmail: botEmail ?? '',
      stream: stream ?? '',
      topic: topic ?? 'Birthdays',
      enabled: enabled ?? false,
    };

    // Only update the API key if it's not the masked placeholder
    if (apiKey && apiKey !== '••••••••') {
      updateData.apiKey = apiKey;
    }

    const settings = await prisma.zulipSettings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });

    return NextResponse.json({ ...settings, apiKey: settings.apiKey ? '••••••••' : '' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
