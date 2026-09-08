/* =========================
   FIND PAGE ELEMENTS
========================= */

const moduleButtons =
  [...document.querySelectorAll(
    ".module-point"
  )];

const modulePanels =
  [...document.querySelectorAll(
    ".module-panel"
  )];


/* =========================
   DATA LAYER
========================= */

window.dataLayer =
  window.dataLayer || [];


/* =========================
   SELECT A MODULE
========================= */

function selectModule(
  selectedButton,
  moveFocus = false
) {

  const panelId =
    selectedButton.getAttribute(
      "aria-controls"
    );

  const selectedPanel =
    document.getElementById(panelId);


  /* Update all seven buttons */

  moduleButtons.forEach((button) => {

    const isSelected =
      button === selectedButton;

    button.classList.toggle(
      "is-active",
      isSelected
    );

    button.setAttribute(
      "aria-selected",
      String(isSelected)
    );

    button.setAttribute(
      "tabindex",
      isSelected ? "0" : "-1"
    );

  });


  /* Show the correct information */

  modulePanels.forEach((panel) => {

    const isSelected =
      panel === selectedPanel;

    panel.hidden = !isSelected;

    panel.classList.toggle(
      "is-active",
      isSelected
    );

  });


  /* Used for keyboard navigation */

  if (moveFocus) {
    selectedButton.focus();
  }


/* Prepare information for GTM */

window.dataLayer.push({
  event: "module_select",

  module_number:
    selectedButton.dataset.module,

  course_name:
    selectedButton.dataset.courseName,

  selected_case:
    selectedButton.classList.contains(
      "selected-module"
    )
});


/* Scroll to the information on mobile */

if (
  window.matchMedia(
    "(max-width: 900px)"
  ).matches &&
  selectedPanel
) {
  window.setTimeout(() => {
    selectedPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}

}


/* =========================
   MOUSE CLICKS
========================= */

moduleButtons.forEach((button) => {

  button.addEventListener(
    "click",
    () => {
      selectModule(button);
    }
  );

});


/* =========================
   KEYBOARD NAVIGATION
========================= */

moduleButtons.forEach(
  (button, buttonIndex) => {

    button.addEventListener(
      "keydown",
      (event) => {

        let nextIndex = buttonIndex;


        if (
          event.key === "ArrowRight" ||
          event.key === "ArrowDown"
        ) {
          nextIndex =
            (
              buttonIndex + 1
            ) %
            moduleButtons.length;
        }


        if (
          event.key === "ArrowLeft" ||
          event.key === "ArrowUp"
        ) {
          nextIndex =
            (
              buttonIndex -
              1 +
              moduleButtons.length
            ) %
            moduleButtons.length;
        }


        if (event.key === "Home") {
          nextIndex = 0;
        }


        if (event.key === "End") {
          nextIndex =
            moduleButtons.length - 1;
        }


        if (nextIndex !== buttonIndex) {

          event.preventDefault();

          selectModule(
            moduleButtons[nextIndex],
            true
          );

        }

      }
    );

  }
);


/* =========================
   PREPARE THE FIRST MODULE
========================= */

const firstActiveButton =
  document.querySelector(
    ".module-point.is-active"
  ) ||
  moduleButtons[0];

if (firstActiveButton) {

  moduleButtons.forEach((button) => {

    const isSelected =
      button === firstActiveButton;

    button.setAttribute(
      "tabindex",
      isSelected ? "0" : "-1"
    );

  });

}