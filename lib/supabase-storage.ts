import { createClient } from "@supabase/supabase-js";

export const profileMediaBucket = "profile-media";

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase storage is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function ensureProfileMediaBucket() {
  const supabase = getSupabaseAdminClient();
  const { data: bucket } = await supabase.storage.getBucket(profileMediaBucket);

  if (bucket) {
    return supabase;
  }

  const { error } = await supabase.storage.createBucket(profileMediaBucket, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    fileSizeLimit: "10MB"
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }

  return supabase;
}
