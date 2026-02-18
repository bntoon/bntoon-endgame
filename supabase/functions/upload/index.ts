const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin token
    const authHeader = req.headers.get("Authorization");
    const isAdmin = await verifyAdminToken(authHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim to avoid accidental whitespace/newlines from secret inputs.
    const storageZone = (Deno.env.get("BUNNY_STORAGE_ZONE") ?? "").trim();
    const apiKey = (Deno.env.get("BUNNY_STORAGE_API_KEY") ?? "").trim();
    const cdnHostname = (Deno.env.get("BUNNY_CDN_HOSTNAME") ?? "").trim()
      .replace(/^https?:\/\//, "").replace(/\/+$/, "");


    if (!storageZone || !apiKey || !cdnHostname) {
      return new Response(
        JSON.stringify({
          error:
            "Storage configuration missing. Ensure BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, and BUNNY_CDN_HOSTNAME are set.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = (formData.get("path") as string) ?? "";
    const action = (formData.get("action") as string) || "upload";

    // Validate action
    if (action !== "upload" && action !== "delete") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPath = String(path).replace(/^\/+/, "");

    // Path traversal protection
    if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // File size limit (10MB)
    if (file && file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // File type validation
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
    if (file) {
      const ext = "." + (file.name || normalizedPath).split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return new Response(JSON.stringify({ error: "File type not allowed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "delete") {
      // Delete file from Bunny.net
      const deleteResponse = await fetch(
        `https://sg.storage.bunnycdn.com/${storageZone}/${normalizedPath}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: apiKey,
          },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error("Failed to delete file");
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file
    if (!file || !normalizedPath) {
      return new Response(
        JSON.stringify({ error: "File and path are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const uploadUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${normalizedPath}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: uint8Array,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Bunny upload error:", errorText);
      console.error("Bunny upload debug:", {
        status: uploadResponse.status,
        storageZone,
        path: normalizedPath,
        apiKeyLength: apiKey.length,
        url: uploadUrl,
      });
      throw new Error(
        `Bunny Storage request failed (${uploadResponse.status}): ${errorText || "No response body"}`
      );
    }

    const publicUrl = `https://${cdnHostname}/${normalizedPath}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyAdminToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  
  const token = authHeader.replace("Bearer ", "");
  const secret = Deno.env.get("ADMIN_JWT_SECRET");
  if (!secret) return false;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const signatureArrayBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureArrayBuffer).set(signature);
    
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureArrayBuffer,
      encoder.encode(signatureInput)
    );

    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
