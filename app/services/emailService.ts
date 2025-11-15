import nodemailer from 'nodemailer';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function escapeHtmlWithLineBreaks(text: string): string {
  return escapeHtml(text).replace(/\r\n|\r|\n/g, '<br>');
}

async function loadEmailTemplate(templateName: string): Promise<string> {
  // In production Docker: /app/templates/emails/templateName
  // In development: /home/user/project/templates/emails/templateName
  // process.cwd() returns the working directory where the app is started
  const templatePath = join(process.cwd(), 'templates', 'emails', templateName);
  return await readFile(templatePath, 'utf-8');
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  static async sendEmail(options: EmailOptions): Promise<void> {
    const missingVars = [];
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASSWORD) missingVars.push('SMTP_PASSWORD');
    if (!process.env.SMTP_FROM) missingVars.push('SMTP_FROM');

    if (missingVars.length > 0) {
      console.error(`Email notification failed: Missing required environment variables: ${missingVars.join(', ')}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: {
          'X-MT-Category': 'Notification'
        }
      });
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  static async sendRequestCompletedEmail(
    userEmail: string,
    requestTitle: string,
    requestMediaType: string,
    notes?: string
  ): Promise<void> {
    const subject = '✓ Your request has been completed';

    const templateName = notes ? 'request-completed-with-notes.html' : 'request-completed.html';
    let html = await loadEmailTemplate(templateName);

    html = html.replace(/\{\{MEDIA_TYPE\}\}/g, escapeHtml(requestMediaType));
    html = html.replace(/\{\{TITLE\}\}/g, escapeHtml(requestTitle));
    if (notes) {
      html = html.replace(/\{\{NOTES\}\}/g, escapeHtml(notes));
    }

    await this.sendEmail({ to: userEmail, subject, html });
  }

  static async sendRequestDeletedEmail(
    userEmail: string,
    requestTitle: string,
    requestMediaType: string,
    notes?: string
  ): Promise<void> {
    const subject = '✕ Your request has been removed';

    const templateName = notes ? 'request-deleted-with-notes.html' : 'request-deleted.html';
    let html = await loadEmailTemplate(templateName);

    html = html.replace(/\{\{MEDIA_TYPE\}\}/g, escapeHtml(requestMediaType));
    html = html.replace(/\{\{TITLE\}\}/g, escapeHtml(requestTitle));
    if (notes) {
      html = html.replace(/\{\{NOTES\}\}/g, escapeHtml(notes));
    }

    await this.sendEmail({ to: userEmail, subject, html });
  }

  static async sendVerificationEmail(
    userEmail: string,
    verificationToken: string
  ): Promise<void> {
    if (!process.env.APP_URL) {
      throw new Error('APP_URL environment variable is not set');
    }

    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    const subject = 'Verify your email address';

    let html = await loadEmailTemplate('verification.html');

    html = html.replace(/\{\{VERIFICATION_URL\}\}/g, escapeHtml(verificationUrl));

    await this.sendEmail({ to: userEmail, subject, html });
  }

  static async sendContactRequest(
    requestType: string,
    username: string,
    message?: string
  ): Promise<void> {
    if (!process.env.ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not set');
    }

    const subject = requestType === 'password-reset'
      ? `Password Reset Request from ${username}`
      : `Contact Request from ${username}`;

    const templateName = requestType === 'password-reset'
      ? 'contact-password-reset.html'
      : 'contact-general.html';

    let html = await loadEmailTemplate(templateName);

    html = html.replace(/\{\{USERNAME\}\}/g, escapeHtml(username));
    if (message) {
      html = html.replace(/\{\{MESSAGE\}\}/g, escapeHtmlWithLineBreaks(message));
    }

    await this.sendEmail({ to: process.env.ADMIN_EMAIL, subject, html });
  }
}
