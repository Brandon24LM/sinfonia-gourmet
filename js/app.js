document.addEventListener("DOMContentLoaded", () => {
  // Año footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Burger
  const burger = document.querySelector(".burger");
  const mobileNav = document.querySelector(".mobileNav");
  if (burger && mobileNav) {
    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
    });
  }

  // Tilt
  function enableTilt(el) {
    const max = Number(el.dataset.tiltMax || "10");
    const clamp = (n, min, maxv) => Math.max(min, Math.min(maxv, n));

    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;

      const rotY = clamp((x - 0.5) * (max * 2), -max, max);
      const rotX = clamp((0.5 - y) * (max * 2), -max, max);

      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      el.style.boxShadow = "0 18px 50px rgba(0,0,0,.45)";
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
      el.style.boxShadow = "";
    });
  }
  document.querySelectorAll("[data-tilt]").forEach(enableTilt);

  // Filtro menú
  const filterButtons = document.querySelectorAll(".filter[data-filter]");
  const items = document.querySelectorAll(".menuItem[data-category]");
  if (filterButtons.length && items.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.filter;

        filterButtons.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        items.forEach((card) => {
          const cat = card.dataset.category;
          const show = target === "all" || cat === target;
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  // ===========================
  // Carrusel PRO (transform)
  // ===========================
  const carousel = document.querySelector("[data-carousel]");
  const track = document.querySelector("[data-carousel-track]");
  const btnPrev = document.querySelector("[data-carousel-prev]");
  const btnNext = document.querySelector("[data-carousel-next]");

  if (carousel && track) {
    const items = Array.from(track.querySelectorAll(".carousel__item"));
    let index = 0;
    let x = 0;
    let isDown = false;
    let startX = 0;
    let startTranslate = 0;
    let hover = false;

    const gap = 14; // debe coincidir con el CSS (gap: 14px)
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    function itemStep() {
      if (!items.length) return 0;
      // ancho real del item + gap
      const w = items[0].getBoundingClientRect().width;
      return w + gap;
    }

    function maxTranslate() {
      // máximo hacia la izquierda (negativo)
      const content = track.scrollWidth; // sirve aunque no usemos scroll
      const viewport = carousel.getBoundingClientRect().width;
      return Math.min(0, viewport - content); // negativo o 0
    }

    function applyTransform(noAnim = false) {
      const maxT = maxTranslate();
      x = clamp(x, maxT, 0);
      if (noAnim) track.style.transition = "none";
      else track.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1)";
      track.style.transform = `translateX(${x}px)`;
    }

    function goTo(i) {
      const step = itemStep();
      index = clamp(i, 0, Math.max(0, items.length - 1));
      x = -index * step;
      applyTransform(false);
    }

    // Botones
    btnPrev?.addEventListener("click", () => goTo(index - 1));
    btnNext?.addEventListener("click", () => goTo(index + 1));

    // Hover pause
    carousel.addEventListener("mouseenter", () => (hover = true));
    carousel.addEventListener("mouseleave", () => (hover = false));

    // Drag con pointer
    track.addEventListener("pointerdown", (e) => {
      isDown = true;
      track.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startTranslate = x;
      track.style.transition = "none";
    });

    track.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      x = startTranslate + dx;
      applyTransform(true);
    });

    function endDrag() {
      if (!isDown) return;
      isDown = false;

      // “snap” al item más cercano
      const step = itemStep();
      if (step > 0) {
        index = Math.round(Math.abs(x) / step);
        goTo(index);
      } else {
        applyTransform(false);
      }
    }

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    // Auto-play suave
    function auto() {
      if (!isDown && !hover && items.length > 1) {
        const next = index + 1;
        if (next > items.length - 1) goTo(0);
        else goTo(next);
      }
    }

    let timer = setInterval(auto, 3200);

    // Recalcular al cambiar tamaño
    window.addEventListener("resize", () => {
      // Mantener el índice y recalcular translate
      goTo(index);
    });

    // Inicial
    goTo(0);
  }

  // Reservas: mesas según personas
  const peopleEl = document.getElementById("people");
  const tableEl = document.getElementById("table");
  const form = document.getElementById("bookingForm");
  const result = document.getElementById("bookingResult");

  if (peopleEl && tableEl) {
    const tablesByPeople = {
      1: ["Barra 1", "Barra 2"],
      2: ["Mesa 2A", "Mesa 2B", "Ventana 2C"],
      3: ["Mesa 4A", "Mesa 4B"],
      4: ["Mesa 4A", "Mesa 4B", "Mesa 4C"],
      5: ["Mesa 6A", "Mesa 6B"],
      6: ["Mesa 6A", "Mesa 6B", "Mesa 8A"],
      7: ["Mesa 8A", "Mesa 8B"],
      8: ["Mesa 8A", "Mesa 8B", "Privado 10 (sujeto a disponibilidad)"]
    };

    peopleEl.addEventListener("change", () => {
      const n = Number(peopleEl.value || 0);
      tableEl.innerHTML = "";

      if (!n || !tablesByPeople[n]) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Selecciona personas primero…";
        tableEl.appendChild(opt);
        return;
      }

      const first = document.createElement("option");
      first.value = "";
      first.textContent = "Selecciona una mesa…";
      tableEl.appendChild(first);

      tablesByPeople[n].forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        tableEl.appendChild(opt);
      });
    });
  }

  if (form && result) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      result.textContent = "✅ Reserva enviada (demo). Te contactaremos para confirmar disponibilidad.";
      form.reset();
      if (tableEl) {
        tableEl.innerHTML = '<option value="">Selecciona personas primero…</option>';
      }
    });
  }
});


// ===== Reservas: resumen + validación + overlay =====
const form = document.getElementById("reservationForm");

if (form) {
  const $ = (id) => document.getElementById(id);

  const overlay = $("overlay");
  const overlayTitle = $("overlayTitle");
  const overlayMsg = $("overlayMsg");
  const overlayIcon = $("overlayIcon");
  const overlayClose = $("overlayClose");

  const sBranch = $("sBranch");
  const sName = $("sName");
  const sEmail = $("sEmail");
  const sPhone = $("sPhone");
  const sDate = $("sDate");
  const sTime = $("sTime");
  const sGuests = $("sGuests");
  const sTable = $("sTable");
  const sOccasion = $("sOccasion");

  const inputs = {
    branch: $("branch"),
    name: $("name"),
    phone: $("phone"),
    email: $("email"),
    date: $("date"),
    time: $("time"),
    guests: $("guests"),
    table: $("table"),
    occasion: $("occasion"),
  };

  // Mesas sugeridas por personas
  const tableMap = {
    1: ["Bar-01", "Bar-02"],
    2: ["A1", "A2", "A3", "A4"],
    3: ["B1", "B2", "B3"],
    4: ["C1", "C2", "C3", "C4"],
    5: ["D1", "D2"],
    6: ["E1", "E2"],
    7: ["F1"],
    8: ["F2"]
  };

  function formatDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }

  function showOverlay(type, title, msg) {
    overlay.classList.toggle("is-success", type === "success");
    overlayIcon.textContent = type === "success" ? "✓" : "!";
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  overlayClose.addEventListener("click", hideOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideOverlay();
  });

  function setError(input, message) {
    input.classList.add("invalid");
    const err = document.querySelector(`[data-error-for="${input.name}"]`);
    if (err) err.textContent = message;
  }

  function clearError(input) {
    input.classList.remove("invalid");
    const err = document.querySelector(`[data-error-for="${input.name}"]`);
    if (err) err.textContent = "";
  }

  function populateTables(guestsValue) {
    const select = inputs.table;
    select.innerHTML = "";

    const g = Number(guestsValue);
    if (!g || !tableMap[g]) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.textContent = "Elige primero personas";
      select.appendChild(opt);
      return;
    }

    const first = document.createElement("option");
    first.value = "";
    first.disabled = true;
    first.selected = true;
    first.textContent = "Selecciona una mesa";
    select.appendChild(first);

    tableMap[g].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = `Mesa ${t} (${g} pax)`;
      select.appendChild(opt);
    });
  }

  function updateSummary() {
    sBranch.textContent = inputs.branch.value || "—";
    sName.textContent = inputs.name.value.trim() || "—";
    sEmail.textContent = inputs.email.value.trim() || "—";
    sPhone.textContent = inputs.phone.value.trim() || "—";
    sDate.textContent = formatDate(inputs.date.value);
    sTime.textContent = inputs.time.value || "—";
    sGuests.textContent = inputs.guests.value || "—";
    sTable.textContent = inputs.table.value || "—";
    sOccasion.textContent = inputs.occasion.value || "—";
  }


  

  function validateAll() {
    let ok = true;

    Object.values(inputs).forEach(clearError);

    const name = inputs.name.value.trim();
    const phoneDigits = inputs.phone.value.replace(/\D/g, "");
    const email = inputs.email.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!inputs.branch.value) { setError(inputs.branch, "Selecciona una sucursal."); ok = false; }
    if (name.length < 3) { setError(inputs.name, "Escribe tu nombre (mín. 3 caracteres)."); ok = false; }
    if (phoneDigits.length < 8) { setError(inputs.phone, "Teléfono inválido (mín. 8 dígitos)."); ok = false; }
    if (!emailOk) { setError(inputs.email, "Correo inválido."); ok = false; }

    if (!inputs.date.value) { setError(inputs.date, "Selecciona una fecha."); ok = false; }
    else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const picked = new Date(inputs.date.value + "T00:00:00");
      if (picked < today) { setError(inputs.date, "No puede ser una fecha pasada."); ok = false; }
    }

    if (!inputs.time.value) { setError(inputs.time, "Selecciona una hora."); ok = false; }
    if (!inputs.guests.value) { setError(inputs.guests, "Selecciona el número de personas."); ok = false; }
    if (!inputs.table.value) { setError(inputs.table, "Selecciona una mesa."); ok = false; }

    return ok;
  }

  // Eventos
  inputs.guests.addEventListener("change", () => {
    populateTables(inputs.guests.value);
    updateSummary();
  });

  ["input", "change"].forEach(evt => {
    form.addEventListener(evt, (e) => {
      if (e.target && e.target.name) updateSummary();
    });
  });

  // Inicial
  populateTables(inputs.guests.value);
  updateSummary();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    updateSummary();

    const ok = validateAll();

    if (!ok) {
      showOverlay(
        "error",
        "Faltan datos o hay errores",
        "Por favor corrige los campos marcados en rojo y vuelve a intentar."
      );
      return;
    }

    showOverlay(
      "success",
      "¡Reservación válida!",
      "Tu reservación se registró correctamente (demo). Te esperamos en Sinfonía Gourmet."
    );

    // Reset (opcional): descomenta si quieres limpiar todo después del éxito
    // form.reset();
    // populateTables("");
    // updateSummary();
  });
}