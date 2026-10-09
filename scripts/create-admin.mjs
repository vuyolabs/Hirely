/*
 * Creates (or promotes) an admin account.
 *
 *   pnpm create-admin admin@yourcompany.com 'Str0ng!Passw0rd'
 */
import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
    console.error("Usage: pnpm create-admin <email> <password>");
    process.exit(1);
}
if (
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
) {
    console.error("Password needs 8+ characters with a letter, a number and a symbol.");
    process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const hash = await bcrypt.hash(password, 10);
const { rows } = await client.query(
    `INSERT INTO "User" (id, email, password_hash, role, is_active, created_at, updated_at)
     VALUES ($1, lower($2), $3, 'ADMIN', true, now(), now())
     ON CONFLICT (email) DO UPDATE
       SET role = 'ADMIN', password_hash = EXCLUDED.password_hash, is_active = true, updated_at = now()
     RETURNING id, email`,
    [crypto.randomUUID(), email.trim(), hash]
);

await client.end();
console.log(`Admin ready: ${rows[0].email}`);
