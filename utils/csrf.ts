import crypto from 'crypto';
import type { Session } from 'express-session';

export class CSRFProtection {
  static async validateRequest(request: Request, session: any): Promise<{ success: boolean; error?: string }> {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return { success: true };
    }

    try {
      const formData = await request.formData();
      const csrfToken = formData.get('csrfToken') as string;

      if (!CSRFProtection.verifyToken(session, csrfToken)) {
        return { success: false, error: 'Invalid request. Please try again.' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid request format.' };
    }
  }

  static generateToken(session: Session): string {
    const token = crypto.randomBytes(32).toString('hex');

    session.csrfToken = token;

    return token;
  }

  static getToken(session: Session): string {
    if (session.csrfToken) {
      return session.csrfToken;
    }

    return CSRFProtection.generateToken(session);
  }

  static verifyToken(session: Session, submittedToken: string | null): boolean {
    if (!submittedToken) {
      return false;
    }

    if (!session.csrfToken) {
      return false;
    }

    try {
      const sessionTokenBuffer = Buffer.from(session.csrfToken, 'hex');
      const submittedTokenBuffer = Buffer.from(submittedToken, 'hex');

      if (sessionTokenBuffer.length !== submittedTokenBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sessionTokenBuffer, submittedTokenBuffer);
    } catch (error) {
      return false;
    }
  }

  static addTokenToLoaderData(session: Session, data: any = {}) {
    return {
      ...data,
      csrfToken: CSRFProtection.getToken(session)
    };
  }

  static validateFormAction(formData: FormData, session: Session): { error?: string } | null {
    const csrfToken = formData.get("csrfToken") as string;

    if (!CSRFProtection.verifyToken(session, csrfToken)) {
      return { error: "Invalid request. Please try again." };
    }

    return null;
  }
}