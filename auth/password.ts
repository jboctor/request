import * as argon2 from "argon2";
import { randomBytes } from "crypto";

export class PasswordManager {
  private pepper: string;

  constructor(pepper?: string) {
    this.pepper = pepper ?? "";
  }

  // Generate a cryptographically secure salt
  static generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  // Hash a password by prepending salt and appending pepper
  async hashPassword(password: string, salt: string): Promise<string> {
    const toHash = salt + password + this.pepper;
    return await argon2.hash(toHash);
  }

  // Verify a password against hash, using salt and pepper
  async verifyPassword(hash: string, password: string, salt: string): Promise<boolean> {
    const toVerify = salt + password + this.pepper;
    return await argon2.verify(hash, toVerify);
  }
}
