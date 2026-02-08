import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
	NEXT_PHASE: z.string().optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z.url().optional(),

	// Server
	DATABASE_URL: z
		.string()
		.startsWith("postgres://")
		.or(z.string().startsWith("postgresql://"))
		.optional(),

	BETTER_AUTH_SECRET: z.string().optional(),
	UPSTASH_REDIS_REST_URL: z.url().optional(),
	UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
	MARBLE_WORKSPACE_KEY: z.string().optional(),
	FREESOUND_CLIENT_ID: z.string().optional(),
	FREESOUND_API_KEY: z.string().optional(),
	CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_BUCKET_NAME: z.string().optional(),
	MODAL_TRANSCRIPTION_URL: z.url().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);

export function assertWebServerEnv(env: WebEnv = webEnv): asserts env is WebEnv & {
	NEXT_PUBLIC_MARBLE_API_URL: string;
	DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	UPSTASH_REDIS_REST_URL: string;
	UPSTASH_REDIS_REST_TOKEN: string;
	MARBLE_WORKSPACE_KEY: string;
	FREESOUND_CLIENT_ID: string;
	FREESOUND_API_KEY: string;
	CLOUDFLARE_ACCOUNT_ID: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_BUCKET_NAME: string;
	MODAL_TRANSCRIPTION_URL: string;
} {
	if (
		env.NEXT_PHASE !== undefined ||
		process.env.NEXT_PHASE !== undefined ||
		process.env.ANALYZE !== undefined
	) {
		return;
	}

	const missing: string[] = [];

	if (!env.NEXT_PUBLIC_MARBLE_API_URL) missing.push("NEXT_PUBLIC_MARBLE_API_URL");
	if (!env.DATABASE_URL) missing.push("DATABASE_URL");
	if (!env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
	if (!env.UPSTASH_REDIS_REST_URL) missing.push("UPSTASH_REDIS_REST_URL");
	if (!env.UPSTASH_REDIS_REST_TOKEN) missing.push("UPSTASH_REDIS_REST_TOKEN");
	if (!env.MARBLE_WORKSPACE_KEY) missing.push("MARBLE_WORKSPACE_KEY");
	if (!env.FREESOUND_CLIENT_ID) missing.push("FREESOUND_CLIENT_ID");
	if (!env.FREESOUND_API_KEY) missing.push("FREESOUND_API_KEY");
	if (!env.CLOUDFLARE_ACCOUNT_ID) missing.push("CLOUDFLARE_ACCOUNT_ID");
	if (!env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
	if (!env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
	if (!env.R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");
	if (!env.MODAL_TRANSCRIPTION_URL) missing.push("MODAL_TRANSCRIPTION_URL");

	if (missing.length > 0) {
		throw new Error(`Missing required server environment variables: ${missing.join(", ")}`);
	}
}
