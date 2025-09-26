import { PasswordManager } from "~/utils/password";
import type { user } from "~/database/schema";
import type { Session } from "express-session";
import type { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof user>;

export class AuthService {
  static async login(user: User, password: string, session: Session): Promise<void> {
    const valid = await PasswordManager.verifyPassword(user.password, password, user.salt ?? "");
    if (!valid) {
        throw new Error("Invalid password");
    }

    session.user = { id: user.id, username: user.username, isAdmin: user.isAdmin ?? false };
    session.lastValidated = Date.now();

    return new Promise((resolve, reject) => {
      session.save((saveErr: any) => {
        if (saveErr) {
          reject(new Error("Session save failed"));
          return;
        }
        resolve();
      });
    });
  }

  static logout(session: Session): void {
    session.destroy((err: any) => {
      if (err) throw err;
    });
  }
}