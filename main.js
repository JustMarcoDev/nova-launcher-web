/* =====================================================================
   NOVA LAUNCHER · Web oficial · Scripts
   1. Marca que hay JavaScript (activa las animaciones de revelado)
   2. Versión y enlace de descarga desde GitHub
   3. Vídeo de fondo fijo que baja a medida que avanzas por la web
   4. Barra superior que cambia al hacer scroll
   5. Revelado de secciones al bajar
   6. Onda al hacer clic en los botones
   7. Brillo que sigue al ratón en las tarjetas
   ===================================================================== */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(pointer: fine)").matches;

  /* ---------- 1. Marca de JavaScript ---------- */
  document.documentElement.classList.add("js");


  /* ---------- 2. Versión y descarga ---------- */
  // Consulta la última release del repositorio y apunta los botones al instalador .exe.
  const REPO = "JustMarcoDev/nova-launcher";
  const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

  async function loadLatestRelease() {
    const versionLabels = document.querySelectorAll("#version-label, [data-version]");
    const downloadButtons = document.querySelectorAll("#download-btn, [data-download]");

    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const release = await res.json();

      const exe = (release.assets || []).find((a) => a.name.toLowerCase().endsWith(".exe"));
      if (exe) downloadButtons.forEach((b) => (b.href = exe.browser_download_url));

      const text = `Versión ${release.tag_name || release.name || "más reciente"} · .exe`;
      versionLabels.forEach((el) => (el.textContent = text));
    } catch (err) {
      // Sin conexión o límite de la API: los botones siguen llevando a la página de releases.
      versionLabels.forEach((el) => (el.textContent = "Ver última versión"));
      downloadButtons.forEach((b) => (b.href = RELEASES_URL));
    }
  }
  loadLatestRelease();


  /* ---------- 3. Vídeo de fondo fijo ----------
     El vídeo mide 130% de la pantalla. Cuando estás arriba se ve su parte
     de abajo, y según bajas se desplaza hasta mostrar la parte de arriba.
     Así el fondo siempre está visible en toda la web, sin quedarse en negro. */
  const bgVideo = document.querySelector(".hero-video");
  if (bgVideo) {
    if (prefersReduced) {
      bgVideo.pause();
    } else {
      // Ahorra batería y CPU cuando la pestaña no se ve
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) bgVideo.pause();
        else bgVideo.play().catch(() => {});
      });

      let ticking = false;
      const moveVideo = () => {
        const vh = window.innerHeight;
        const overflow = vh * 0.3;                                  // 130% - 100%
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        const y = -overflow * (1 - progress);
        bgVideo.style.transform = `translate3d(0, ${y}px, 0)`;
        ticking = false;
      };

      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(moveVideo);
            ticking = true;
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", moveVideo);
      moveVideo();
    }
  }


  /* ---------- 4. Barra superior al hacer scroll ---------- */
  const topbar = document.getElementById("topbar");
  const rail = document.querySelector(".scroll-rail span");   // indicador de progreso a la derecha
  function updateTopbar() {
    topbar.classList.toggle("scrolled", window.scrollY > 24);
    if (rail) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      rail.style.transform = `scaleY(${Math.min(1, window.scrollY / max)})`;
    }
  }
  window.addEventListener("scroll", updateTopbar, { passive: true });
  window.addEventListener("resize", updateTopbar);
  updateTopbar();


  /* ---------- 5. Revelado de secciones al bajar ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }


  /* ---------- 6. Onda al hacer clic en los botones ---------- */
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - r.left - size / 2 + "px";
      ripple.style.top = e.clientY - r.top - size / 2 + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });


  /* ---------- 7. Brillo que sigue al ratón en las tarjetas ---------- */
  if (canHover) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }
})();
