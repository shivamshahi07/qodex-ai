import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://obtrgaovwpwkzjympxkl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idHJnYW92d3B3a3pqeW1weGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2NTMsImV4cCI6MjA2MzkxNjY1M30.Fb5hAWZ4ELGcXgWAskDNXfDiMP7Rkeeb30kZrT-FxVE";

export const supabase = createClient(supabaseUrl, supabaseKey);
