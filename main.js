/* Nova Launcher · scripts de la web.
   Qué hace: marca que hay JavaScript, carga la última versión desde GitHub,
   controla el vídeo de fondo, la línea de progreso y las animaciones de entrada. */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(pointer: fine)").matches;

  document.documentElement.classList.add("js");


  /* ----- Última versión desde GitHub ----- */

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

      const label = `Versión ${release.tag_name || release.name || "más reciente"} · .exe`;
      versionLabels.forEach((el) => (el.textContent = label));
    } catch (err) {
      // Sin conexión o límite de la API: los botones llevan a la página de versiones.
      versionLabels.forEach((el) => (el.textContent = "Ver última versión"));
      downloadButtons.forEach((b) => (b.href = RELEASES_URL));
    }
  }
  loadLatestRelease();


  /* ----- Vídeo de fondo que baja con el scroll ----- */

  const bgVideo = document.querySelector(".hero-video");

  if (bgVideo) {
    if (prefersReduced) {
      bgVideo.pause();
    } else {
      // Se pausa cuando la pestaña no está visible
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) bgVideo.pause();
        else bgVideo.play().catch(() => {});
      });

      let ticking = false;

      // El vídeo mide 130% de la pantalla: el 30% extra permite desplazarlo
      function moveVideo() {
        const overflow = window.innerHeight * 0.3;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        bgVideo.style.transform = `translate3d(0, ${-overflow * (1 - progress)}px, 0)`;
        ticking = false;
      }

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


  /* ----- Cabecera y línea de progreso ----- */

  const topbar = document.getElementById("topbar");
  const progressBar = document.querySelector(".scroll-rail span");

  function updateHeader() {
    topbar.classList.toggle("scrolled", window.scrollY > 24);

    if (progressBar) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressBar.style.transform = `scaleY(${Math.min(1, window.scrollY / maxScroll)})`;
    }
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
  updateHeader();


  /* ----- Secciones que aparecen al bajar ----- */

  const revealItems = document.querySelectorAll(".reveal");

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
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    // Navegadores muy antiguos: mostrar todo directamente
    revealItems.forEach((el) => el.classList.add("in"));
  }


  /* ----- Onda al hacer clic en los botones ----- */

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");

      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - rect.left - size / 2 + "px";
      ripple.style.top = e.clientY - rect.top - size / 2 + "px";

      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });


  /* ----- Brillo que sigue al ratón en las tarjetas (solo con ratón) ----- */

  if (canHover) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }
})();
