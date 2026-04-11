import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // Basic security so not anyone can trigger the cron:
    // E.g., check for an Authorization header if needed.
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate(); // 1-31

    const people = await prisma.person.findMany();
    
    // Filter matching people (ignoring year)
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

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Birthday email skipped due to missing SMTP configuration. People with birthdays today:', birthdayPeople.map(p => p.name).join(', '));
      return NextResponse.json({ 
        message: 'Birthdays found, but SMTP is not configured.',
        people: birthdayPeople.map(p => p.name)
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailPromises = birthdayPeople.map(async (person) => {
      const mailOptions = {
        from: `"Birthday Tracker" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER, // Who receives the email
        subject: `🍰 It's ${person.name}'s Birthday Today!`,
        text: `Reminder: Today is ${person.name}'s birthday! Don't forget to buy a cake.`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>🎉 Birthday Reminder!</h2>
          <p>Today is <strong>${person.name}'s</strong> birthday!</p>
          <p>Log in to the Tracker to make sure a cake has been bought.</p>
        </div>`
      };
      
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ message: 'Birthday emails sent successfully!', count: birthdayPeople.length });
  } catch (error) {
    console.error('Error during cron execution:', error);
    return NextResponse.json({ error: 'Failed to execute cron' }, { status: 500 });
  }
}
