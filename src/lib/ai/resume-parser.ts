import "server-only";

import OpenAI from "openai";

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export type ParsedResume = {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;

    skills: string[];

    education: {
        institution: string;
        degree: string | null;
        field: string | null;
        startDate: string | null;
        endDate: string | null;
    }[];

    experience: {
        company: string;
        title: string;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
    }[];

    projects: {
        name: string;
        description: string | null;
        technologies: string[];
    }[];
};

export async function parseResume(
    resumeText: string
): Promise<ParsedResume> {
    const response = await groq.responses.create({
        model: "openai/gpt-oss-120b",

        input: [
            {
                role: "system",
                content: `
You are a resume extraction system.

Extract factual information from the provided resume text.

Rules:
- Extract only information explicitly present in the resume.
- Never invent or assume information.
- If information is not present, return null.
- Preserve the candidate's actual skills and experience.
- Do not infer skills that are not explicitly supported.
- Keep dates in YYYY-MM format when possible.
- Extract employment experience separately from projects.
- Extract all relevant technical and professional skills.
- Return only the requested structured data.
                `,
            },
            {
                role: "user",
                content: `
Extract the candidate information from this resume:

--- RESUME START ---

${resumeText}

--- RESUME END ---
                `,
            },
        ],

        text: {
            format: {
                type: "json_schema",
                name: "resume",
                strict: true,
                schema: {
                    type: "object",

                    properties: {
                        firstName: {
                            type: ["string", "null"],
                        },

                        lastName: {
                            type: ["string", "null"],
                        },

                        phone: {
                            type: ["string", "null"],
                        },

                        location: {
                            type: ["string", "null"],
                        },

                        headline: {
                            type: ["string", "null"],
                        },

                        summary: {
                            type: ["string", "null"],
                        },

                        skills: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },

                        education: {
                            type: "array",
                            items: {
                                type: "object",

                                properties: {
                                    institution: {
                                        type: "string",
                                    },

                                    degree: {
                                        type: ["string", "null"],
                                    },

                                    field: {
                                        type: ["string", "null"],
                                    },

                                    startDate: {
                                        type: ["string", "null"],
                                    },

                                    endDate: {
                                        type: ["string", "null"],
                                    },
                                },

                                required: [
                                    "institution",
                                    "degree",
                                    "field",
                                    "startDate",
                                    "endDate",
                                ],

                                additionalProperties: false,
                            },
                        },

                        experience: {
                            type: "array",
                            items: {
                                type: "object",

                                properties: {
                                    company: {
                                        type: "string",
                                    },

                                    title: {
                                        type: "string",
                                    },

                                    startDate: {
                                        type: ["string", "null"],
                                    },

                                    endDate: {
                                        type: ["string", "null"],
                                    },

                                    description: {
                                        type: ["string", "null"],
                                    },
                                },

                                required: [
                                    "company",
                                    "title",
                                    "startDate",
                                    "endDate",
                                    "description",
                                ],

                                additionalProperties: false,
                            },
                        },

                        projects: {
                            type: "array",
                            items: {
                                type: "object",

                                properties: {
                                    name: {
                                        type: "string",
                                    },

                                    description: {
                                        type: ["string", "null"],
                                    },

                                    technologies: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                        },
                                    },
                                },

                                required: [
                                    "name",
                                    "description",
                                    "technologies",
                                ],

                                additionalProperties: false,
                            },
                        },
                    },

                    required: [
                        "firstName",
                        "lastName",
                        "phone",
                        "location",
                        "headline",
                        "summary",
                        "skills",
                        "education",
                        "experience",
                        "projects",
                    ],

                    additionalProperties: false,
                },
            },
        },
    });

    if (!response.output_text) {
        throw new Error("Groq resume parser returned no output");
    }

    return JSON.parse(response.output_text) as ParsedResume;
}