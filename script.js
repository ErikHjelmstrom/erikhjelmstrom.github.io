/* =========================
   FIND PAGE ELEMENTS
========================= */

const horizontalSection =
  document.querySelector(".horizontal-section");

const horizontalTrack =
  document.querySelector(".horizontal-track");

const panels =
  [...document.querySelectorAll(".panel")];

const navLinks =
  [...document.querySelectorAll(".site-nav a")];

const hero =
  document.querySelector(".hero");

const heroThread =
  document.querySelector(".hero-thread path");

const horizontalThread =
  document.querySelector(
    ".horizontal-thread path"
  );

const progressBar =
  document.querySelector(
    ".horizontal-progress span"
  );

const contact =
  document.querySelector("#contact");


/* =========================
   SCREEN SETTINGS
========================= */

const desktopQuery =
  window.matchMedia("(min-width: 901px)");

const reducedMotionQuery =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

let horizontalDistance = 0;

let targetProgress = 0;
let renderedProgress = 0;

let animationFrame = null;


/* =========================
   HELPER
========================= */

const clamp = (
  value,
  min = 0,
  max = 1
) => {
  return Math.min(
    Math.max(value, min),
    max
  );
};


/* =========================
   ACTIVE MENU LINK
========================= */

function setActiveLink(sectionName) {
  navLinks.forEach((link) => {
    const isActive =
      link.dataset.section === sectionName;

    link.classList.toggle(
      "is-active",
      isActive
    );
  });
}


/* =========================
   MEASURE HORIZONTAL AREA
========================= */

function measureHorizontalSection() {
  if (
    !horizontalSection ||
    !horizontalTrack
  ) {
    return;
  }

  /*
    On mobile, the panels remain vertical.
  */

  if (!desktopQuery.matches) {
    horizontalSection.style.height = "auto";
    horizontalTrack.style.transform = "none";

    horizontalDistance = 0;

    return;
  }

  /*
    Calculate how far the horizontal row
    must travel.
  */

  horizontalDistance = Math.max(
    horizontalTrack.scrollWidth -
      window.innerWidth,
    0
  );

  /*
    Create enough vertical space to control
    the full horizontal movement.
  */

  horizontalSection.style.height =
    `${
      horizontalDistance +
      window.innerHeight
    }px`;
}


/* =========================
   READ SCROLL POSITION
========================= */

function readScrollTarget() {
  if (
    !horizontalSection ||
    horizontalDistance <= 0
  ) {
    targetProgress = 0;
    return;
  }

  targetProgress = clamp(
    (
      window.scrollY -
      horizontalSection.offsetTop
    ) /
    horizontalDistance
  );
}


/* =========================
   HERO LINE
========================= */

function updateHeroThread() {
  if (!heroThread || !hero) {
    return;
  }

  if (reducedMotionQuery.matches) {
    heroThread.style.strokeDashoffset = "0";
    return;
  }

  /*
    The first part is visible immediately.
    The rest is drawn while scrolling
    through the landing page.
  */

  const heroProgress = clamp(
    (
      window.scrollY +
      window.innerHeight * 0.62
    ) /
    hero.offsetHeight
  );

  heroThread.style.strokeDashoffset =
    String(1 - heroProgress);
}


/* =========================
   ACTIVE HORIZONTAL PANEL
========================= */

function updateActivePanel(currentX) {
  if (
    !horizontalSection ||
    panels.length === 0
  ) {
    return;
  }

  const sectionTop =
    horizontalSection.offsetTop;

  const sectionBottom =
    sectionTop +
    horizontalSection.offsetHeight;

  const insideHorizontalSection =
    window.scrollY >= sectionTop &&
    window.scrollY <
      sectionBottom -
      window.innerHeight * 0.2;

  document.body.classList.toggle(
    "is-horizontal",
    insideHorizontalSection &&
      desktopQuery.matches
  );

  if (
    !insideHorizontalSection ||
    !desktopQuery.matches
  ) {
    return;
  }

  const viewportCenter =
    currentX +
    window.innerWidth / 2;

  const closestPanel = panels.reduce(
    (closest, panel) => {
      const panelCenter =
        panel.offsetLeft +
        panel.offsetWidth / 2;

      const closestCenter =
        closest.offsetLeft +
        closest.offsetWidth / 2;

      const panelDistance =
        Math.abs(
          panelCenter -
          viewportCenter
        );

      const closestDistance =
        Math.abs(
          closestCenter -
          viewportCenter
        );

      return panelDistance < closestDistance
        ? panel
        : closest;
    },
    panels[0]
  );

  if (closestPanel.id === "about") {
    setActiveLink("about");
  }

  if (closestPanel.id === "work") {
    setActiveLink("work");
  }

  if (closestPanel.id === "education") {
    setActiveLink("education");
  }
}


/* =========================
   SMOOTH HORIZONTAL MOVEMENT
========================= */

function renderHorizontalStory() {
  if (!horizontalTrack) {
    return;
  }

  /*
    renderedProgress follows targetProgress
    gradually. This creates the smoother
    movement instead of jumping directly
    between scroll positions.
  */

  const smoothing =
    reducedMotionQuery.matches
      ? 1
      : 0.1;

  renderedProgress +=
    (
      targetProgress -
      renderedProgress
    ) *
    smoothing;

  /*
    Stop calculating once the two values
    are nearly identical.
  */

  if (
    Math.abs(
      targetProgress -
      renderedProgress
    ) < 0.0001
  ) {
    renderedProgress = targetProgress;
  }

  const currentX =
    renderedProgress *
    horizontalDistance;


  /* Move panels horizontally */

  if (desktopQuery.matches) {
    horizontalTrack.style.transform =
      `translate3d(
        ${-currentX.toFixed(2)}px,
        0,
        0
      )`;
  }


  /* Update progress line */

  if (progressBar) {
    progressBar.style.transform =
      `scaleX(${renderedProgress})`;
  }


  /*
    The horizontal blue line is completely
    hidden until the horizontal journey
    actually begins.
  */

  if (horizontalThread) {
    horizontalThread.style.opacity =
      renderedProgress > 0.002
        ? "1"
        : "0";

    horizontalThread.style.strokeDashoffset =
      String(1 - renderedProgress);
  }


  updateActivePanel(currentX);


  /*
    Continue the smooth animation until
    renderedProgress reaches targetProgress.
  */

  if (
    Math.abs(
      targetProgress -
      renderedProgress
    ) > 0.0001
  ) {
    animationFrame =
      window.requestAnimationFrame(
        renderHorizontalStory
      );
  } else {
    animationFrame = null;
  }
}


/* =========================
   CONTACT MENU LINK
========================= */

function updateContactNavigation() {
  if (!contact) {
    return;
  }

  const contactStart =
    contact.offsetTop -
    window.innerHeight * 0.45;

  if (window.scrollY >= contactStart) {
    setActiveLink("contact");
  }
}


/* =========================
   REQUEST AN UPDATE
========================= */

function requestRender() {
  updateHeroThread();
  readScrollTarget();
  updateContactNavigation();

  if (animationFrame === null) {
    animationFrame =
      window.requestAnimationFrame(
        renderHorizontalStory
      );
  }
}


/* =========================
   MENU NAVIGATION
========================= */

function scrollToPanel(panel) {
  if (
    !horizontalSection ||
    !panel
  ) {
    return;
  }

  /*
    Normal vertical navigation on mobile.
  */

  if (!desktopQuery.matches) {
    panel.scrollIntoView({
      behavior:
        reducedMotionQuery.matches
          ? "auto"
          : "smooth"
    });

    return;
  }

  /*
    Calculate which vertical scroll position
    corresponds to the selected panel.
  */

  const firstPanel = panels[0];

  const targetX = clamp(
    panel.offsetLeft -
      firstPanel.offsetLeft,
    0,
    horizontalDistance
  );

  window.scrollTo({
    top:
      horizontalSection.offsetTop +
      targetX,

    behavior:
      reducedMotionQuery.matches
        ? "auto"
        : "smooth"
  });
}


navLinks.forEach((link) => {
  link.addEventListener(
    "click",
    (event) => {
      const targetId =
        link.getAttribute("href");

      const target =
        document.querySelector(targetId);

      if (
        target &&
        target.classList.contains("panel")
      ) {
        event.preventDefault();
        scrollToPanel(target);
      }
    }
  );
});


/* =========================
   BROWSER EVENTS
========================= */

window.addEventListener(
  "scroll",
  requestRender,
  { passive: true }
);

window.addEventListener(
  "resize",
  () => {
    measureHorizontalSection();
    readScrollTarget();
    requestRender();
  }
);

window.addEventListener(
  "load",
  () => {
    measureHorizontalSection();
    readScrollTarget();

    renderedProgress =
      targetProgress;

    requestRender();
  }
);

desktopQuery.addEventListener(
  "change",
  () => {
    measureHorizontalSection();
    readScrollTarget();

    renderedProgress =
      targetProgress;

    requestRender();
  }
);


/* =========================
   START PAGE
========================= */

measureHorizontalSection();
readScrollTarget();

renderedProgress =
  targetProgress;

requestRender();