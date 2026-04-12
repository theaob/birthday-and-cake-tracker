import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

    // Load settings from DB, fall back to env vars
    const dbSettings = await prisma.emailSettings.findUnique({ where: { id: 'singleton' } });

    const smtpHost   = dbSettings?.smtpHost   || process.env.SMTP_HOST   || '';
    const smtpPort   = dbSettings?.smtpPort   || parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = dbSettings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true');
    const smtpUser   = dbSettings?.smtpUser   || process.env.SMTP_USER   || '';
    const smtpPass   = dbSettings?.smtpPass   || process.env.SMTP_PASS   || '';
    const enabled    = dbSettings?.enabled    ?? true;
    const recipientsRaw = dbSettings?.recipients || process.env.NOTIFICATION_EMAIL || smtpUser;
    const recipients = recipientsRaw.split(',').map((r: string) => r.trim()).filter(Boolean);

    if (!enabled) {
      return NextResponse.json({ message: 'Email reminders are disabled.' });
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('Birthday email skipped: SMTP not configured. Birthdays today:', birthdayPeople.map(p => p.name).join(', '));
      return NextResponse.json({
        message: 'Birthdays found, but SMTP is not configured.',
        people: birthdayPeople.map(p => p.name),
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'Birthdays found, but no recipients configured.', people: birthdayPeople.map(p => p.name) });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const names = birthdayPeople.map(p => p.name);
    const subject = names.length === 1
      ? `🍰 It's ${names[0]}'s Birthday Today!`
      : `🍰 ${names.length} Birthdays Today!`;

    const html = `<div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
      <h2>🎉 Birthday Reminder!</h2>
      <p>The following people have a birthday today:</p>
      <ul>${names.map(n => `<li><strong>${n}</strong></li>`).join('')}</ul>
      <p>Log in to the Birthday & Cake Tracker to make sure a cake has been organised for everyone!</p>
    </div>`;

    await transporter.sendMail({
      from: `"Birthday Tracker" <${smtpUser}>`,
      to: recipients.join(', '),
      subject,
      text: `Birthdays today: ${names.join(', ')}. Don't forget the cake!`,
      html,
    });

    return NextResponse.json({ message: 'Birthday emails sent!', count: birthdayPeople.length, recipients });
  } catch (error) {
    console.error('Error during cron execution:', error);
    return NextResponse.json({ error: 'Failed to execute cron' }, { status: 500 });
  }
}
