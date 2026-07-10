import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.1";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verificar que el llamador tiene sesión activa
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { subject, text, storagePath, filename, grupo } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Filtrar por grupo. Si no viene grupo asumimos 'atm_bbva' (el flujo
    // original: MP BBVA + Auditorías). Nunca enviar a todos por seguridad.
    const grupoActivo = grupo || 'atm_bbva';

    const { data: contactos, error: dbError } = await supabase
      .from("email_contactos")
      .select("email")
      .eq("activo", true)
      .contains("grupos", [grupoActivo]);

    if (dbError) throw dbError;
    if (!contactos || contactos.length === 0) {
      return new Response(JSON.stringify({ error: `No hay contactos activos configurados para el grupo '${grupoActivo}'. Configura al menos uno en /admin/contactos.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[send-email] grupo=${grupoActivo} destinatarios=${contactos.length}`);

    const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    const toEmails = contactos.map((c: { email: string }) => c.email);

    const mailOptions: Record<string, unknown> = {
      from: `CheckList ATM <${GMAIL_USER}>`,
      to: toEmails.join(","),
      subject,
      text,
    };

    if (storagePath && filename) {
      const { data: fileData, error: dlError } = await supabase.storage
        .from("pdf-attachments")
        .download(storagePath);
      if (dlError) throw new Error("Error descargando PDF: " + dlError.message);

      const uint8Array = new Uint8Array(await fileData.arrayBuffer());
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Content = btoa(binary);

      mailOptions.attachments = [
        {
          filename,
          content: base64Content,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ];

      await supabase.storage.from("pdf-attachments").remove([storagePath]);
    }

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
