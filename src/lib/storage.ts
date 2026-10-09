import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const bucket = process.env.SUPABASE_RESUME_BUCKET ?? "resumes";

let client: SupabaseClient | undefined;

/*
 * Server-side client using the secret key, which bypasses RLS.
 * Created lazily so a missing key fails the upload, not the build.
 */
function storage() {
    if (!client) {
        const url = process.env.SUPABASE_URL;
        const secretKey = process.env.SUPABASE_SECRET_KEY;

        if (!url || !secretKey) {
            throw new Error(
                "SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use resume storage."
            );
        }

        client = createClient(url, secretKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return client.storage.from(bucket);
}

export async function uploadResume(
    key: string,
    file: Buffer,
    contentType: string
) {
    const { error } = await storage()
        .upload(key, file, {
            contentType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Resume upload failed: ${error.message}`);
    }
}

export async function deleteResume(key: string) {
    const { error } = await storage()
        .remove([key]);

    if (error) {
        throw new Error(`Resume delete failed: ${error.message}`);
    }
}

/*
 * Short-lived URL for viewing/downloading a resume from a
 * private bucket. Check authorization before calling this.
 */
export async function getResumeUrl(
    key: string,
    expiresInSeconds = 60 * 5
) {
    const { data, error } = await storage()
        .createSignedUrl(key, expiresInSeconds);

    if (error) {
        throw new Error(`Could not create resume URL: ${error.message}`);
    }

    return data.signedUrl;
}
