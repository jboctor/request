import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
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
          'X-MT-Category': 'notification'
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dcfce7; color: #166534; padding: 16px 20px; border-bottom: 2px solid #86efac; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
            .content { background-color: #f3f4f6; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; margin-top: 5px; }
            .note-box { background-color: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 6px; margin-top: 15px; }
            .footer { color: #6b7280; font-size: 14px; margin-top: 20px; }

            @media (prefers-color-scheme: dark) {
              body { color: #f9fafb; }
              .header { background-color: #14532d !important; color: #dcfce7 !important; border-bottom-color: #166534 !important; }
              .content { background-color: #1f2937 !important; }
              .detail-box { background-color: #374151 !important; border-left-color: #22c55e !important; }
              .value { color: #f9fafb !important; }
              .label { color: #d1d5db !important; }
              .note-box { background-color: #14532d !important; border-color: #166534 !important; }
              .footer { color: #d1d5db !important; }
            }
          </style>
        </head>
        <body>
          <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div class="header" style="background-color: #dcfce7; color: #166534; padding: 16px 20px; border-bottom: 2px solid #86efac; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600;">✓ Request Completed</h1>
            </div>
            <div class="content" style="background-color: #f3f4f6; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Good news! Your <strong>${requestMediaType}</strong> request has been completed and is ready for you.</p>

              <div class="detail-box" style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
                <div class="value" style="color: #111827;">${requestTitle}</div>
              </div>

              ${notes ? `
                <div class="note-box" style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 6px; margin-top: 15px;">
                  <div class="label" style="font-weight: bold; color: #6b7280;">Note from admin</div>
                  <div class="value" style="color: #111827; margin-top: 5px;">${notes}</div>
                </div>
              ` : ''}

              <p class="footer" style="color: #6b7280; font-size: 14px; margin-top: 20px;">Thank you for using John Boctor Services!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: userEmail, subject, html });
  }

  static async sendRequestDeletedEmail(
    userEmail: string,
    requestTitle: string,
    requestMediaType: string,
    notes?: string
  ): Promise<void> {
    const subject = '✕ Your request has been removed';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #fee2e2; color: #991b1b; padding: 16px 20px; border-bottom: 2px solid #fca5a5; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
            .content { background-color: #f3f4f6; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; margin-top: 5px; }
            .note-box { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 15px; }
            .footer { color: #6b7280; font-size: 14px; margin-top: 20px; }

            @media (prefers-color-scheme: dark) {
              body { color: #f9fafb; }
              .header { background-color: #7f1d1d !important; color: #fecaca !important; border-bottom-color: #991b1b !important; }
              .content { background-color: #1f2937 !important; }
              .detail-box { background-color: #374151 !important; border-left-color: #ef4444 !important; }
              .value { color: #f9fafb !important; }
              .label { color: #d1d5db !important; }
              .note-box { background-color: #7f1d1d !important; border-color: #991b1b !important; }
              .footer { color: #d1d5db !important; }
            }
          </style>
        </head>
        <body>
          <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div class="header" style="background-color: #fee2e2; color: #991b1b; padding: 16px 20px; border-bottom: 2px solid #fca5a5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600;">✕ Request Removed</h1>
            </div>
            <div class="content" style="background-color: #f3f4f6; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Your <strong>${requestMediaType}</strong> request has been removed from the queue.</p>

              <div class="detail-box" style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626;">
                <div class="value" style="color: #111827;">${requestTitle}</div>
              </div>

              ${notes ? `
                <div class="note-box" style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 15px;">
                  <div class="label" style="font-weight: bold; color: #6b7280;">Reason</div>
                  <div class="value" style="color: #111827; margin-top: 5px;">${notes}</div>
                </div>
              ` : ''}

              <p class="footer" style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please reach out to us.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: userEmail, subject, html });
  }
}
