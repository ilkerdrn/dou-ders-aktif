import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xsyaicybachxyfiauygy.supabase.co";
const supabasePublishableKey = "sb_publishable_jR6KR3TWo3F3Bmj3CMQv7Q_LAvZ5Up6";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export const roomTopic = (code: string) =>
  `dou-room-${code.replace(/\s/g, "")}`;
