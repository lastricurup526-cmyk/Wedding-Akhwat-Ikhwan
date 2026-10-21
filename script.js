/* ============================================
   WEDDING DATA — SATU SUMBER TANGGAL & ENDPOINT
   ============================================ */
const weddingData = {
  weddingDate: "2027-01-01T08:00:00", // ganti sesuai tanggal & jam akad
  gasUrl: "PASTE_URL_GOOGLE_APPS_SCRIPT_DI_SINI" // isi setelah deploy Web App
};

/* ============================================
   COUNTDOWN (REAL-TIME)
   ============================================ */
function initCountdown() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const countdownEl = document.getElementById("countdown");
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const targetDate = new Date(weddingData.weddingDate).getTime();
  let countdownInterval;

  function updateCountdown() {
    const distance = targetDate - Date.now();

    if (distance <= 0) {
      clearInterval(countdownInterval);
      if (countdownEl) {
        countdownEl.innerHTML = '<p class="countdown-ended">Acara Telah Berlangsung</p>';
      }
      return;
    }

    daysEl.textContent = String(Math.floor(distance / 86400000)).padStart(2, "0");
    hoursEl.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0");
    minutesEl.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0");
    secondsEl.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, "0");
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

/* ============================================
   BUKA UNDANGAN
   ============================================ */
function initOpenInvitation() {
  const openBtn = document.getElementById("openInvitation");
  const openingSection = document.getElementById("opening");
  const mainContent = document.getElementById("mainContent");
  const bgMusic = document.getElementById("bgMusic");

  if (!openBtn || !openingSection || !mainContent) return;

  openBtn.addEventListener("click", () => {
    openingSection.classList.add("opening-hidden");
    document.body.style.overflowY = "auto";

    requestAnimationFrame(() => {
      mainContent.classList.add("content-visible");
    });

    setTimeout(() => {
      openingSection.style.display = "none";
    }, 800);

    if (bgMusic) {
      bgMusic.play().catch(() => {});
    }
  });
}

/* ============================================
   MUSIC CONTROL
   ============================================ */
function initMusicControl() {
  const bgMusic = document.getElementById("bgMusic");
  const playBtn = document.getElementById("playMusic");
  const pauseBtn = document.getElementById("pauseMusic");
  if (!bgMusic || !playBtn || !pauseBtn) return;

  playBtn.addEventListener("click", () => bgMusic.play().catch(() => {}));
  pauseBtn.addEventListener("click", () => bgMusic.pause());
}

/* ============================================
   COPY REKENING
   ============================================ */
function initCopyAccount() {
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetEl = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!targetEl) return;
      const accountNumber = targetEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(accountNumber);
        const originalText = btn.textContent;
        btn.textContent = "Tersalin!";
        setTimeout(() => (btn.textContent = originalText), 2000);
      } catch {
        alert("Nomor rekening: " + accountNumber);
      }
    });
  });
}

/* ============================================
   GALERI LIGHTBOX
   ============================================ */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (!galleryItems.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<button type="button" class="lightbox-close" aria-label="Tutup galeri">&times;</button><img src="" alt="" class="lightbox-image">`;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector(".lightbox-image");
  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const img = item.querySelector(".gallery-photo");
      if (!img) return;
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightbox.classList.add("lightbox-active");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("lightbox-active");
  }
}

/* ============================================
   RSVP FORM — TERHUBUNG KE GOOGLE APPS SCRIPT
   ============================================ */
function initRsvpForm() {
  const rsvpForm = document.getElementById("rsvpForm");
  const submitBtn = document.getElementById("rsvpSubmitBtn");
  const statusEl = document.getElementById("rsvpStatus");
  if (!rsvpForm || !submitBtn || !statusEl) return;

  let isSubmitting = false;

  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const attendance = rsvpForm.querySelector('input[name="attendance"]:checked');
    const guestCount = document.getElementById("guestCount").value;

    if (!attendance) {
      showStatus("Mohon pilih konfirmasi kehadiran terlebih dahulu.", "error");
      return;
    }
    if (!guestCount) {
      showStatus("Mohon isi jumlah tamu.", "error");
      return;
    }

    const payload = {
      attendance: attendance.value,
      guestCount: guestCount,
      message: document.getElementById("rsvpMessage").value.trim()
    };

    isSubmitting = true;
    submitBtn.disabled = true;
    showStatus("Mengirim RSVP...", "loading");

    try {
      const response = await fetch(weddingData.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Gagal mengirim");

      showStatus("Terima kasih telah mengisi RSVP 🤍", "success");
      rsvpForm.reset();
      loadWishes();
    } catch (err) {
      showStatus("Maaf, RSVP belum berhasil dikirim. Silakan coba lagi.", "error");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
    }
  });

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = "rsvp-status" + (type ? " status-" + type : "");
  }
}

/* ============================================
   UCAPAN & DOA — DINAMIS DARI GOOGLE SHEETS
   ============================================ */
async function loadWishes() {
  const wishesList = document.getElementById("wishesList");
  if (!wishesList || !weddingData.gasUrl || weddingData.gasUrl.includes("PASTE_URL")) return;

  try {
    const response = await fetch(weddingData.gasUrl);
    if (!response.ok) throw new Error("Gagal mengambil data");

    const data = await response.json();
    // Struktur data di bawah ini ASUMSI SEMENTARA (array of {name, message, time})
    // -> akan disesuaikan setelah kode Google Apps Script kamu diterima

    if (!Array.isArray(data) || data.length === 0) {
      wishesList.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama memberikan doa 🤍</p>';
      return;
    }

    wishesList.innerHTML = data.map((wish) => `
      <article class="wish-card">
        <p class="wish-name">${escapeHtml(wish.name || "Tamu")}</p>
        <p class="wish-message">${escapeHtml(wish.message || "")}</p>
        <p class="wish-time">${escapeHtml(wish.time || "")}</p>
      </article>
    `).join("");
  } catch (err) {
    // biarkan pesan "belum ada ucapan" tetap tampil jika gagal fetch
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================
   NAVIGASI AKTIF
   ============================================ */
function initActiveNav() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = ["couple", "event", "gallery", "rsvp"].map((id) => document.getElementById(id)).filter(Boolean);
  if (!navLinks.length || !sections.length) return;

  function updateActiveLink() {
    let currentId = "";
    const scrollPos = window.scrollY + window.innerHeight / 3;
    sections.forEach((section) => { if (section.offsetTop <= scrollPos) currentId = section.id; });
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + currentId));
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink();
}

/* ============================================
   INIT ALL
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initOpenInvitation();
  initMusicControl();
  initCopyAccount();
  initGalleryLightbox();
  initRsvpForm();
  initActiveNav();
  loadWishes();
});