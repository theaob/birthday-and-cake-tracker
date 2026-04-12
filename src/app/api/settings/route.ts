import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.emailSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    return NextResponse.json({
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : '',
      passwordRequired: !!process.env.ADMIN_PASSWORD,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Require admin password if one is configured
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const providedPassword = request.headers.get('x-admin-password');
      if (providedPassword !== adminPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, recipients, enabled } = body;

    const updateData: Record<string, unknown> = {
      smtpHost: smtpHost ?? '',
      smtpPort: smtpPort ? Number(smtpPort) : 587,
      smtpSecure: smtpSecure ?? false,
      smtpUser: smtpUser ?? '',
      recipients: recipients ?? '',
      enabled: enabled ?? false,
    };

    // Only update password if it's not the masked placeholder
    if (smtpPass && smtpPass !== '••••••••') {
      updateData.smtpPass = smtpPass;
    }

    const settings = await prisma.emailSettings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });

    return NextResponse.json({ ...settings, smtpPass: settings.smtpPass ? '••••••••' : '' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
