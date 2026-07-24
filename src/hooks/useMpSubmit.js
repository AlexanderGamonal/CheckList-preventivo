import { useState } from 'react';
import { saveMantenimiento } from '../services/mantenimientoService.js';
import { sendNotificationEmail } from '../services/emailService.js';
import { initForm } from '../constants/devices.js';

export function useMpSubmit({ form, sections, fotosAntes, fotosDespues, setForm, setFotosAntes, setFotosDespues, setTab, clearDraft, setToast }) {
  const [enviando, setEnviando] = useState(false);
  const [sendStep, setSendStep] = useState('');

  function validar() {
    // ── Info básica ─────────────────────────────────────────────────
    if (!form.atmTipo) return "Selecciona el tipo de cajero";
    if (!form.marca) return "Selecciona la marca del cajero";
    if (!form.punto) return "Ingresa el Nombre del Punto / Agencia";
    if (!form.fecha) return "Ingresa la fecha de mantenimiento";
    if (!form.idAtm) return "Ingresa el ID del ATM";
    if (!form.tec) return "Ingresa el nombre del técnico";

    // ── Site: todos los 7 ítems obligatorios ────────────────────────
    const SITE_ITEMS = [
      "Iluminación", "Ubicación / Accesibilidad", "Limpieza de Cabina",
      "Tacho de Papel / Basurero", "Aire Acondicionado / Ventilación",
      "Señalética y Adhesivos", "Estado Piso y Techo",
    ];
    for (let i = 0; i < SITE_ITEMS.length; i++) {
      if (!form.site[i]) return `Site: evalúa "${SITE_ITEMS[i]}"`;
    }

    // ── Voltajes: Cable interno ATM y UPS obligatorios ──────────────
    const VOLT_OBLIGATORIOS = ["Cable interno ATM", "UPS"];
    for (const item of VOLT_OBLIGATORIOS) {
      const v = form.voltages[item];
      if (!v || (v.ln === "" && v.lt === "")) {
        return `Voltaje: completa al menos L-N o L-T de "${item}"`;
      }
    }

    // ── Dispositivos: todos los ítems deben tener estado ────────────
    const sinEstado = sections.reduce((acc, s) => {
      const faltantes = s.items.filter((_, ii) => !form.devices[s.id + "_" + ii]?.est);
      if (faltantes.length) acc.push({ seccion: s.title, faltantes });
      return acc;
    }, []);
    if (sinEstado.length > 0) {
      const primera = sinEstado[0];
      return `Dispositivos: evalúa todos los ítems de "${primera.seccion}"`;
    }

    // ── Cierre ───────────────────────────────────────────────────────
    if (!form.estFinal) return "Cierre: selecciona el Estado Final";
    if (!form.obsGen?.trim()) return "Cierre: completa las Observaciones Generales";

    // ── Fotos ────────────────────────────────────────────────────────
    if (fotosAntes.length < 5) return `Fotos: faltan ${5 - fotosAntes.length} foto(s) de Antes (mínimo 5)`;
    if (fotosDespues.length < 5) return `Fotos: faltan ${5 - fotosDespues.length} foto(s) de Después (mínimo 5)`;

    return null;
  }

  async function handleGenerarPDF() {
    if (!form.atmDbId) {
      setToast({ msg: "El ATM no fue encontrado en la BD. Contacta al administrador para registrarl0.", type: "err" });
      return;
    }
    const error = validar();
    if (error) {
      setToast({ msg: error, type: "err" });
      return;
    }

    // Nombre del archivo PDF: MP-Punto-IDAtm
    const puntoSlug = (form.punto || "SinPunto")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const idSlug = (form.idAtm || "SinID").replace(/[^a-zA-Z0-9]/g, "");
    const filename = "MP-" + puntoSlug + "-" + idSlug;

    setEnviando(true);
    setSendStep("Generando PDF…");
    try {
      const { generatePDF } = await import('../services/pdfService.js');
      const pdfBase64 = await generatePDF("pdf-root", filename);
      saveMantenimiento(form, sections).catch((e) =>
        console.error("DB save:", e),
      );
      await sendNotificationEmail(form, pdfBase64, setSendStep);
      setSendStep("✓ Correo enviado");
      setToast({ msg: "✓ PDF generado y correo enviado", type: "ok" });
      // Limpiar borrador y restablecer formulario
      clearDraft();
      setForm(initForm());
      setFotosAntes([]);
      setFotosDespues([]);
      setTab(0);
    } catch (e) {
      console.error(e);
      setToast({
        msg: "Error: " + (e?.message || "no se pudo enviar el correo"),
        type: "err",
      });
    } finally {
      setEnviando(false);
      setSendStep('');
    }
  }

  return { enviando, sendStep, handleGenerarPDF };
}
