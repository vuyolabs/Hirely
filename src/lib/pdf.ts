import "server-only";

import { extractText } from "unpdf";

export async function extractPdfText(
    buffer: Buffer
): Promise<string> {
    const { text } = await extractText(new Uint8Array(buffer));

    return text.join("\n");
}