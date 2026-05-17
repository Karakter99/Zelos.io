import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    const data = await resend.emails.send({
      from: 'Zelos Support <onboarding@resend.dev>', // ⚠️ Buraya dokunma, Resend'in test domaini.
      to: ['roedubridge@gmail.com'], // 🔴 BURAYA KENDİ E-POSTA ADRESİNİ YAZ
      replyTo: email, // 🟢 İŞTE DÜZELTTİĞİMİZ YER! 
      subject: `[Zelos Support] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: auto; padding: 20px; border: 4px solid black; background-color: #f5f8f8;">
          <h2 style="text-transform: uppercase; background-color: #FFE600; padding: 10px; border: 2px solid black;">New Support Ticket</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 2px solid black; margin: 20px 0;" />
          <p style="font-weight: bold; text-transform: uppercase;">Message:</p>
          <div style="background-color: white; padding: 15px; border: 2px solid black;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}