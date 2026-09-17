window.dataLayer = window.dataLayer || [];

function pushPortfolioEvent(eventName, eventData = {}) {
  window.dataLayer.push({
    event: eventName,
    ...eventData
  });
}

pushPortfolioEvent("case_view", {
  case_name: "ai_investment_employer_formations",
  case_category: "growth_toolbox"
});
const rows = [
  { year: 2015, ai: 9.300375, firms: 292062, aiIndex: 100.00, firmIndex: 100.00 },
  { year: 2016, ai: 10.154276, firms: 287512, aiIndex: 109.18, firmIndex: 98.44 },
  { year: 2017, ai: 14.065456, firms: 289394, aiIndex: 151.24, firmIndex: 99.09 },
  { year: 2018, ai: 21.051401, firms: 300363, aiIndex: 226.35, firmIndex: 102.84 },
  { year: 2019, ai: 32.073516, firms: 280266, aiIndex: 344.86, firmIndex: 95.96 },
  { year: 2020, ai: 44.216815, firms: 268961, aiIndex: 475.43, firmIndex: 92.09 },
  { year: 2021, ai: 86.855559, firms: 315318, aiIndex: 933.89, firmIndex: 107.96 },
  { year: 2022, ai: 61.185078, firms: 296531, aiIndex: 657.88, firmIndex: 101.53 }
];

const integer = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dataRows = document.getElementById("dataRows");

if (dataRows) {
  dataRows.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.year}</td>
      <td>${decimal.format(row.ai)}</td>
      <td>${decimal.format(row.aiIndex)}</td>
      <td>${integer.format(row.firms)}</td>
      <td>${decimal.format(row.firmIndex)}</td>
    </tr>
  `).join("");
}

Chart.defaults.font.family = '"DM Sans", Arial, sans-serif';
Chart.defaults.color = "#5f5d55";

new Chart(document.getElementById("comparisonChart"), {
  type: "line",
  data: {
    labels: rows.map((row) => row.year),
    datasets: [
      {
        label: "Privata AI-investeringar",
        data: rows.map((row) => row.aiIndex),
        rawValues: rows.map((row) => row.ai),
        borderColor: "#3d4fd6",
        backgroundColor: "#3d4fd6",
        pointStyle: "circle",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        tension: 0,
        spanGaps: false
      },
      {
        label: "Arbetsgivarföretag inom fyra kvartal",
        data: rows.map((row) => row.firmIndex),
        rawValues: rows.map((row) => row.firms),
        borderColor: "#d86632",
        backgroundColor: "#d86632",
        borderDash: [10, 7],
        pointStyle: "rectRot",
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        tension: 0,
        spanGaps: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 450 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 12,
          padding: 24,
          font: { size: 13, weight: "bold" }
        }
      },
      tooltip: {
        backgroundColor: "#121311",
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        padding: 14,
        callbacks: {
          label(context) {
            const raw = context.dataset.rawValues[context.dataIndex];
            const original = context.datasetIndex === 0
              ? `${decimal.format(raw)} mdr USD`
              : `${integer.format(raw)} företag`;
            return `${context.dataset.label}: index ${decimal.format(context.parsed.y)} · ${original}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: "#8e897f" },
        ticks: { font: { size: 13 } }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Utveckling sedan 2015, index",
          color: "#121311",
          font: { size: 13, weight: "bold" }
        },
        grid: { color: "#d8d3c9", lineWidth: 1 },
        border: { display: false },
        ticks: {
          font: { size: 12 },
          callback: (value) => integer.format(value)
        }
      }
    }
  }
});

const carousel = document.getElementById("instagramCarousel");
const carouselTrack = document.getElementById("carouselTrack");
const carouselCounter = document.getElementById("carouselCounter");
const previousButton = document.getElementById("carouselPrev");
const nextButton = document.getElementById("carouselNext");
const dotButtons = Array.from(document.querySelectorAll("#carouselDots button"));
const slideCount = dotButtons.length;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeSlide = 0;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerDeltaX = 0;
let horizontalGesture = false;

function updateCarousel(announce = true) {
  if (!carouselTrack) return;

  carouselTrack.style.transform = `translateX(-${activeSlide * 100}%)`;
  carouselCounter.textContent = `${activeSlide + 1}/${slideCount}`;
  previousButton.disabled = activeSlide === 0;
  nextButton.disabled = activeSlide === slideCount - 1;

  dotButtons.forEach((button, index) => {
    const isCurrent = index === activeSlide;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (!announce) {
    carouselCounter.setAttribute("aria-live", "off");
    window.requestAnimationFrame(() => carouselCounter.setAttribute("aria-live", "polite"));
  }
}

function goToSlide(index) {
  const nextSlide = Math.max(0, Math.min(slideCount - 1, index));

  if (nextSlide === activeSlide) return;

  activeSlide = nextSlide;
  updateCarousel();

  pushPortfolioEvent("carousel_slide_view", {
    case_name: "ai_investment_employer_formations",
    slide_number: activeSlide + 1,
    slide_total: slideCount
  });
}

if (carousel && carouselTrack && slideCount) {
  previousButton.addEventListener("click", () => goToSlide(activeSlide - 1));
  nextButton.addEventListener("click", () => goToSlide(activeSlide + 1));

  dotButtons.forEach((button, index) => {
    button.addEventListener("click", () => goToSlide(index));
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(activeSlide - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(activeSlide + 1);
    }
  });

  carousel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerDeltaX = 0;
    horizontalGesture = false;
  });

  carousel.addEventListener("pointermove", (event) => {
    if (!pointerStartX && !pointerStartY) return;

    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (!horizontalGesture && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      horizontalGesture = true;
    }

    if (horizontalGesture) {
      event.preventDefault();
      pointerDeltaX = deltaX;
      const resistance = (activeSlide === 0 && deltaX > 0) || (activeSlide === slideCount - 1 && deltaX < 0) ? 0.24 : 1;
      carouselTrack.style.transition = "none";
      carouselTrack.style.transform = `translateX(calc(-${activeSlide * 100}% + ${deltaX * resistance}px))`;
    }
  });

  function finishSwipe() {
    if (!pointerStartX && !pointerStartY) return;

    carouselTrack.style.transition = reduceMotion ? "none" : "";
    const threshold = Math.min(72, carousel.clientWidth * 0.16);

    if (horizontalGesture && Math.abs(pointerDeltaX) >= threshold) {
      goToSlide(activeSlide + (pointerDeltaX < 0 ? 1 : -1));
    } else {
      updateCarousel(false);
    }

    pointerStartX = 0;
    pointerStartY = 0;
    pointerDeltaX = 0;
    horizontalGesture = false;
  }

  carousel.addEventListener("pointerup", finishSwipe);
  carousel.addEventListener("pointercancel", finishSwipe);
  carousel.addEventListener("lostpointercapture", finishSwipe);
  updateCarousel(false);
}

const likeButton = document.getElementById("likeButton");
const saveButton = document.getElementById("saveButton");
const shareButton = document.getElementById("shareButton");
const actionFeedback = document.getElementById("actionFeedback");

function toggleConceptAction(button, activeText, inactiveText) {
  const isActive = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", String(!isActive));
  actionFeedback.textContent = isActive ? inactiveText : activeText;
}

likeButton?.addEventListener("click", () => {
  toggleConceptAction(likeButton, "Gillat lokalt i konceptet.", "Gilla-markeringen togs bort.");
});

saveButton?.addEventListener("click", () => {
  toggleConceptAction(saveButton, "Sparat lokalt i konceptet.", "Sparmarkeringen togs bort.");
});

shareButton?.addEventListener("click", async () => {
  const shareUrl = `${window.location.href.split("#")[0]}#diagram`;
  const shareData = {
    title: document.title,
    text: "AI-investeringar och nya arbetsgivarföretag i USA, 2015–2022",
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      actionFeedback.textContent = "Delningsdialogen öppnades.";
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      actionFeedback.textContent = "Länken till analysen kopierades.";
    } else {
      actionFeedback.textContent = `Länk till analysen: ${shareUrl}`;
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      actionFeedback.textContent = "Länken kunde inte delas i den här webbläsaren.";
    }
  }
});

const csvDownloadLink = document.querySelector(".data-download");

csvDownloadLink?.addEventListener("click", () => {
  pushPortfolioEvent("csv_download", {
    case_name: "ai_investment_employer_formations",
    file_name: "ai-investment-and-employer-formations-2015-2022.csv"
  });
});