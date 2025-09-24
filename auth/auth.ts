import { PasswordManager } from "./password";
import type { user } from "~/database/schema";
import type { Session } from "express-session";
import type { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof user>;

export class AuthManager {
  private passwordManager: PasswordManager;

  constructor(passwordManager: PasswordManager) {
    this.passwordManager = passwordManager;
  }

  async login(user: User, password: string, session: Session): Promise<void> {
    const valid = await this.passwordManager.verifyPassword(user.password, password, user.salt ?? "");
    if (!valid) {
        throw new Error("Invalid password");
    }
    session.user = { id: user.id, email: user.email, isAdmin: user.isAdmin ?? false };
    session.save((err: any) => {
      if (err) throw err;
    });
  }
  
  logout(session: Session): void {
    session.destroy((err: any) => {
      if (err) throw err;
    });
  }
}
