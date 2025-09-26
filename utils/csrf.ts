import crypto from 'crypto';
import type { Session } from 'express-session';

export class CSRFProtection {
  /**
   * Validate CSRF token for POST requests
   * This can be used as a utility in any action that needs CSRF protection
   */
  static async validateRequest(request: Request, session: any): Promise<{ success: boolean; error?: string }> {
    // Only validate POST, PUT, PATCH, DELETE requests
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

  /**
   * Generate a CSRF token for the user's session
   * This creates a random 32-byte token and stores it in the session
   */
  static generateToken(session: Session): string {
    // Generate a cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Store in session so we can verify it later
    session.csrfToken = token;

    return token;
  }

  /**
   * Get existing CSRF token from session, or generate a new one
   */
  static getToken(session: Session): string {
    // Return existing token if it exists
    if (session.csrfToken) {
      return session.csrfToken;
    }

    // Generate new token if none exists
    return CSRFProtection.generateToken(session);
  }

  /**
   * Verify that submitted token matches session token
   * This prevents CSRF attacks because external sites can't access our session
   */
  static verifyToken(session: Session, submittedToken: string | null): boolean {
    // No token submitted = invalid
    if (!submittedToken) {
      return false;
    }

    // No token in session = invalid
    if (!session.csrfToken) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    // This ensures comparison takes the same time regardless of where strings differ
    try {
      const sessionTokenBuffer = Buffer.from(session.csrfToken, 'hex');
      const submittedTokenBuffer = Buffer.from(submittedToken, 'hex');

      // Tokens must be same length
      if (sessionTokenBuffer.length !== submittedTokenBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sessionTokenBuffer, submittedTokenBuffer);
    } catch (error) {
      // Invalid hex string or other error
      return false;
    }
  }

  /**
   * Middleware helper to add CSRF token to loader data
   * This makes the token available to your forms
   */
  static addTokenToLoaderData(session: Session, data: any = {}) {
    return {
      ...data,
      csrfToken: CSRFProtection.getToken(session)
    };
  }

  /**
   * Simple helper to validate CSRF and return error if invalid
   * Use this at the beginning of your actions
   */
  static validateFormAction(formData: FormData, session: Session): { error?: string } | null {
    const csrfToken = formData.get("csrfToken") as string;

    if (!CSRFProtection.verifyToken(session, csrfToken)) {
      return { error: "Invalid request. Please try again." };
    }

    return null;
  }
}