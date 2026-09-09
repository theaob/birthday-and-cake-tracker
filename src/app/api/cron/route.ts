import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This route is called by an external scheduler, not a logged-in browser
// session, so it's excluded from the Keycloak gate in src/middleware.ts
// and instead protected by its own bearer-token secret.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const people = await prisma.person.findMany();

    const birthdayPeople = people.filter((person) => {
      const birthDate = new Date(person.birthday);
      return (
        birthDate.getMonth() + 1 === currentMonth &&
        birthDate.getDate() === currentDay
      );
    });

    if (birthdayPeople.length === 0) {
      return NextResponse.json({ message: 'No birthdays today.' });
    }

    const settings = await prisma.zulipSettings.findUnique({ where: { id: 'singleton' } });

    const siteUrl = settings?.siteUrl || process.env.ZULIP_SITE_URL || '';
    const botEmail = settings?.botEmail || process.env.ZULIP_BOT_EMAIL || '';
    const apiKey = settings?.apiKey || process.env.ZULIP_API_KEY || '';
    const stream = settings?.stream || process.env.ZULIP_STREAM || '';
    const topic = settings?.topic || process.env.ZULIP_TOPIC || 'Birthdays';
    const enabled = settings?.enabled ?? true;

    if (!enabled) {
      return NextResponse.json({ message: 'Zulip reminders are disabled.' });
    }

    if (!siteUrl || !botEmail || !apiKey || !stream) {
      console.log('Birthday reminder skipped: Zulip not configured. Birthdays today:', birthdayPeople.map(p => p.name).join(', '));
      return NextResponse.json({
        message: 'Birthdays found, but Zulip is not configured.',
        people: birthdayPeople.map(p => p.name),
      });
    }

    const names = birthdayPeople.map(p => p.name);
    const content = names.length === 1
      ? `🍰 It's **${names[0]}**'s birthday today! Don't forget the cake.`
      : `🍰 Birthdays today: ${names.map(n => `**${n}**`).join(', ')}. Don't forget the cake!`;

    const messagesUrl = new URL('/api/v1/messages', siteUrl).toString();
    const auth = Buffer.from(`${botEmail}:${apiKey}`).toString('base64');

    const response = await fetch(messagesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'stream',
        to: stream,
        topic,
        content,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Zulip API error:', response.status, errorBody);
      return NextResponse.json(
        { error: 'Failed to send Zulip message', status: response.status },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: 'Birthday reminder sent to Zulip!', count: birthdayPeople.length, stream, topic });
  } catch (error) {
    console.error('Error during cron execution:', error);
    return NextResponse.json({ error: 'Failed to execute cron' }, { status: 500 });
  }
}
