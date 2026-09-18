/* =========================
   BUILD VS BUZZ
========================= */

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const CACHE_DURATION = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 12000;
const STABILITY_THRESHOLD_PERCENT = 5;

const elements = {
  form: document.getElementById("signalForm"),
  input: document.getElementById("topicInput"),
  submitButton: document.querySelector(
    "#signalForm button[type='submit']"
  ),
  exampleButtons: Array.from(
    document.querySelectorAll("[data-topic]")
  ),
  status: document.getElementById("appStatus"),
  resultPanel: document.getElementById("resultPanel"),
  resultTopic: document.getElementById("resultTopic"),
  resultPeriod: document.getElementById("resultPeriod"),
  signalProfile: document.getElementById("signalProfile"),
  profileDescription: document.getElementById(
    "profileDescription"
  ),
  buildChange: document.getElementById("buildChange"),
  buildCurrent: document.getElementById("buildCurrent"),
  buildPrevious: document.getElementById("buildPrevious"),
  buzzChange: document.getElementById("buzzChange"),
  buzzCurrent: document.getElementById("buzzCurrent"),
  buzzPrevious: document.getElementById("buzzPrevious"),
  buildResults: document.getElementById("buildResults"),
  buzzResults: document.getElementById("buzzResults"),
  partialWarning: document.getElementById("partialWarning"),
  githubRateLimit: document.getElementById("githubRateLimit"),
  newSearchButton: document.getElementById("newSearchButton"),
  errorPanel: document.getElementById("errorPanel"),
  errorMessage: document.getElementById("errorMessage"),
  retryButton: document.getElementById("retryButton"),
};

const resultCache = new Map();

let lastSearchTopic = "";
let searchInProgress = false;

window.dataLayer = window.dataLayer || [];

window.dataLayer.push({
  event: "api_tool_view",
  tool_name: "build_vs_buzz",
  tool_category: "growth_toolbox",
});


/* =========================
   DATE PERIODS
========================= */

function createUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

function getUtcToday() {
  const now = new Date();

  return createUtcDate(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
}

function addDays(date, numberOfDays) {
  return new Date(
    date.getTime() +
    numberOfDays * DAY_IN_MILLISECONDS
  );
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toStartTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

function toEndTimestamp(date) {
  return Math.floor(
    (
      date.getTime() +
      DAY_IN_MILLISECONDS -
      1000
    ) / 1000
  );
}

function createComparisonPeriods() {
  const today = getUtcToday();

  /*
    Use complete UTC days.
    The current period therefore ends yesterday.
  */

  const currentEnd = addDays(today, -1);
  const currentStart = addDays(currentEnd, -29);

  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -29);

  return {
    current: {
      start: currentStart,
      end: currentEnd,
    },
    previous: {
      start: previousStart,
      end: previousEnd,
    },
  };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPeriod(period) {
  return `${formatDate(period.start)}–${formatDate(period.end)}`;
}


/* =========================
   INPUT
========================= */

function cleanTopic(value) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/["\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateTopic(topic) {
  if (topic.length < 2) {
    return "Enter at least two characters.";
  }

  if (topic.length > 60) {
    return "Use no more than 60 characters.";
  }

  return "";
}


/* =========================
   FETCH HELPERS
========================= */

async function fetchJson(url, options = {}) {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        data?.message ||
        `Request failed with status ${response.status}.`
      );

      error.status = response.status;
      error.rateLimitReset = response.headers.get(
        "x-ratelimit-reset"
      );

      throw error;
    }

    return {
      data,
      headers: response.headers,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request timed out.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}


/* =========================
   GITHUB
========================= */

function buildGitHubUrl(topic, period, resultCount) {
  const searchQuery = [
    `"${topic}"`,
    "in:name,description,topics",
    `created:${toIsoDate(period.start)}..${toIsoDate(period.end)}`,
  ].join(" ");

  const parameters = new URLSearchParams({
    q: searchQuery,
    sort: "stars",
    order: "desc",
    per_page: String(resultCount),
  });

  return (
    "https://api.github.com/search/repositories?" +
    parameters.toString()
  );
}

async function fetchGitHubPeriod(
  topic,
  period,
  resultCount
) {
  const url = buildGitHubUrl(
    topic,
    period,
    resultCount
  );

  const response = await fetchJson(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  return {
    total: response.data.total_count,
    incomplete: response.data.incomplete_results,
    items: response.data.items ?? [],
    rateRemaining: response.headers.get(
      "x-ratelimit-remaining"
    ),
    rateReset: response.headers.get(
      "x-ratelimit-reset"
    ),
  };
}


/* =========================
   HACKER NEWS
========================= */

function buildHackerNewsUrl(
  topic,
  period,
  resultCount
) {
  const numericFilters = [
    `created_at_i>=${toStartTimestamp(period.start)}`,
    `created_at_i<=${toEndTimestamp(period.end)}`,
  ].join(",");

  const parameters = new URLSearchParams({
    query: topic,
    tags: "story",
    numericFilters,
    hitsPerPage: String(resultCount),
  });

  return (
    "https://hn.algolia.com/api/v1/search_by_date?" +
    parameters.toString()
  );
}

async function fetchHackerNewsPeriod(
  topic,
  period,
  resultCount
) {
  const url = buildHackerNewsUrl(
    topic,
    period,
    resultCount
  );

  const response = await fetchJson(url);

  return {
    total: response.data.nbHits,
    items: response.data.hits ?? [],
  };
}


/* =========================
   COMBINED REQUEST
========================= */

function getErrorMessage(result) {
  if (result.status === "rejected") {
    return result.reason?.message || "Unknown API error.";
  }

  return "";
}

function smallestNumber(values) {
  const validNumbers = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!validNumbers.length) {
    return null;
  }

  return Math.min(...validNumbers);
}

async function fetchCombinedSignals(topic, periods) {
  const requests = await Promise.allSettled([
    fetchGitHubPeriod(
      topic,
      periods.current,
      5
    ),
    fetchGitHubPeriod(
      topic,
      periods.previous,
      1
    ),
    fetchHackerNewsPeriod(
      topic,
      periods.current,
      5
    ),
    fetchHackerNewsPeriod(
      topic,
      periods.previous,
      1
    ),
  ]);

  const [
    githubCurrentResult,
    githubPreviousResult,
    hackerNewsCurrentResult,
    hackerNewsPreviousResult,
  ] = requests;

  const githubAvailable =
    githubCurrentResult.status === "fulfilled" &&
    githubPreviousResult.status === "fulfilled";

  const hackerNewsAvailable =
    hackerNewsCurrentResult.status === "fulfilled" &&
    hackerNewsPreviousResult.status === "fulfilled";

  const github = githubAvailable
    ? {
        available: true,
        current: githubCurrentResult.value.total,
        previous: githubPreviousResult.value.total,
        items: githubCurrentResult.value.items,
        incomplete:
          githubCurrentResult.value.incomplete ||
          githubPreviousResult.value.incomplete,
        rateRemaining: smallestNumber([
          githubCurrentResult.value.rateRemaining,
          githubPreviousResult.value.rateRemaining,
        ]),
        rateReset:
          githubCurrentResult.value.rateReset ||
          githubPreviousResult.value.rateReset,
      }
    : {
        available: false,
        error: [
          getErrorMessage(githubCurrentResult),
          getErrorMessage(githubPreviousResult),
        ]
          .filter(Boolean)
          .join(" "),
      };

  const hackerNews = hackerNewsAvailable
    ? {
        available: true,
        current: hackerNewsCurrentResult.value.total,
        previous: hackerNewsPreviousResult.value.total,
        items: hackerNewsCurrentResult.value.items,
      }
    : {
        available: false,
        error: [
          getErrorMessage(hackerNewsCurrentResult),
          getErrorMessage(hackerNewsPreviousResult),
        ]
          .filter(Boolean)
          .join(" "),
      };

  return {
    github,
    hackerNews,
  };
}


/* =========================
   CHANGE & PROFILE
========================= */

function calculateChange(current, previous) {
  if (previous === 0 && current === 0) {
    return {
      label: "No signal",
      direction: "flat",
      percentage: null,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      label: "New",
      direction: "new",
      percentage: null,
    };
  }

  const percentage =
    ((current - previous) / previous) * 100;

  const roundedPercentage = Math.round(percentage);

  let direction = "flat";

  if (percentage > STABILITY_THRESHOLD_PERCENT) {
    direction = "up";
  } else if (
    percentage < -STABILITY_THRESHOLD_PERCENT
  ) {
    direction = "down";
  }

  return {
    label:
      `${roundedPercentage > 0 ? "+" : ""}` +
      `${roundedPercentage}%`,
    direction,
    percentage: roundedPercentage,
  };
}

function createSignalProfile(
  github,
  hackerNews,
  buildChange,
  buzzChange
) {
  if (!github.available || !hackerNews.available) {
    return {
      name: "Partial signal",
      description:
        "Only one source is currently available, so the combined profile cannot be classified.",
    };
  }

  const buildPositive = ["up", "new"].includes(
    buildChange.direction
  );

  const buzzPositive = ["up", "new"].includes(
    buzzChange.direction
  );

  const buildNegative =
    buildChange.direction === "down";

  const buzzNegative =
    buzzChange.direction === "down";

  if (
    github.current === 0 &&
    hackerNews.current === 0
  ) {
    return {
      name: "No visible signal",
      description:
        "Neither source returned activity for the selected topic during the current period.",
    };
  }

  if (buildPositive && buzzPositive) {
    return {
      name: "Shared momentum",
      description:
        "Visible building activity and conversation both increased by more than five percent compared with their previous periods.",
    };
  }

  if (buildPositive && !buzzPositive) {
    return {
      name: "Building ahead of buzz",
      description:
        "Repository creation increased by more than five percent while conversation did not. Visible development may be moving ahead of discussion.",
    };
  }

  if (buzzPositive && !buildPositive) {
    return {
      name: "Buzz ahead of building",
      description:
        "Conversation increased by more than five percent while repository creation did not. Attention may currently be moving faster than visible development.",
    };
  }

  if (buildNegative && buzzNegative) {
    return {
      name: "Cooling signal",
      description:
        "Both visible building activity and conversation declined by more than five percent compared with their previous periods.",
    };
  }

  if (
    buildChange.direction === "flat" &&
    buzzNegative
  ) {
    return {
      name: "Build steady, buzz cooling",
      description:
        "Repository creation is relatively stable while discussion volume is declining.",
    };
  }

  if (
    buzzChange.direction === "flat" &&
    buildNegative
  ) {
    return {
      name: "Buzz steady, build cooling",
      description:
        "Discussion volume is relatively stable while repository creation is declining.",
    };
  }

  if (
    buildChange.direction === "flat" &&
    buzzChange.direction === "flat"
  ) {
    return {
      name: "Stable signal",
      description:
        "Neither source changed by more than five percent between the two periods.",
    };
  }

  return {
    name: "Mixed signal",
    description:
      "The two signals are moving differently. More context is needed before drawing a conclusion.",
  };
}


/* =========================
   RESULT RENDERING
========================= */

function formatInteger(value) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

function setSignalValues(
  source,
  changeElement,
  currentElement,
  previousElement
) {
  if (!source.available) {
    changeElement.textContent = "N/A";
    currentElement.textContent = "Unavailable";
    previousElement.textContent = "Unavailable";
    return null;
  }

  const change = calculateChange(
    source.current,
    source.previous
  );

  changeElement.textContent = change.label;
  changeElement.dataset.direction = change.direction;

  currentElement.textContent =
    formatInteger(source.current);

  previousElement.textContent =
    formatInteger(source.previous);

  return change;
}

function createExternalLink(url, sourceName) {
  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.source = sourceName;

  return link;
}

function renderGitHubResults(source) {
  elements.buildResults.replaceChildren();

  if (!source.available) {
    const item = document.createElement("li");
    item.className = "empty-source";
    item.textContent =
      "GitHub data is currently unavailable.";

    elements.buildResults.append(item);
    return;
  }

  if (!source.items.length) {
    const item = document.createElement("li");
    item.className = "empty-source";
    item.textContent =
      "No matching repositories were found in the current period.";

    elements.buildResults.append(item);
    return;
  }

  source.items.forEach((repository) => {
    const item = document.createElement("li");

    const link = createExternalLink(
      repository.html_url,
      "github"
    );

    const title = document.createElement("strong");
    title.textContent = repository.full_name;

    const metadata = document.createElement("span");
    metadata.textContent =
      `${formatInteger(repository.stargazers_count)} stars` +
      ` · created ${formatDate(
        new Date(repository.created_at)
      )}`;

    link.append(title, metadata);
    item.append(link);
    elements.buildResults.append(item);
  });
}

function getHackerNewsUrl(story) {
  return (
    story.url ||
    `https://news.ycombinator.com/item?id=${story.objectID}`
  );
}

function renderHackerNewsResults(source) {
  elements.buzzResults.replaceChildren();

  if (!source.available) {
    const item = document.createElement("li");
    item.className = "empty-source";
    item.textContent =
      "Hacker News data is currently unavailable.";

    elements.buzzResults.append(item);
    return;
  }

  if (!source.items.length) {
    const item = document.createElement("li");
    item.className = "empty-source";
    item.textContent =
      "No matching Hacker News stories were found in the current period.";

    elements.buzzResults.append(item);
    return;
  }

  source.items.forEach((story) => {
    const item = document.createElement("li");

    const link = createExternalLink(
      getHackerNewsUrl(story),
      "hacker_news"
    );

    const title = document.createElement("strong");
    title.textContent =
      story.title ||
      story.story_title ||
      "Untitled Hacker News story";

    const metadata = document.createElement("span");

    metadata.textContent =
      `${formatInteger(story.points ?? 0)} points` +
      ` · ${formatInteger(
        story.num_comments ?? 0
      )} comments` +
      ` · ${formatDate(new Date(story.created_at))}`;

    link.append(title, metadata);
    item.append(link);
    elements.buzzResults.append(item);
  });
}

function formatRateLimit(github) {
  if (
    !github.available ||
    github.rateRemaining === null
  ) {
    return "";
  }

  let message =
    "GitHub anonymous search requests remaining: " +
    `${github.rateRemaining}.`;

  if (github.rateReset) {
    const resetDate = new Date(
      Number(github.rateReset) * 1000
    );

    if (!Number.isNaN(resetDate.getTime())) {
      const resetTime =
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(resetDate);

      message += ` Resets around ${resetTime}.`;
    }
  }

  return message;
}

function createPartialWarning(github, hackerNews) {
  const messages = [];

  if (!github.available) {
    messages.push(
      "GitHub could not be reached. Build figures and the combined profile are unavailable."
    );
  }

  if (!hackerNews.available) {
    messages.push(
      "Hacker News could not be reached. Buzz figures and the combined profile are unavailable."
    );
  }

  if (github.available && github.incomplete) {
    messages.push(
      "GitHub marked the search result as incomplete. Counts should be treated with additional caution."
    );
  }

  return messages.join(" ");
}

function renderResult(
  topic,
  data,
  periods,
  cached = false
) {
  const buildChange = setSignalValues(
    data.github,
    elements.buildChange,
    elements.buildCurrent,
    elements.buildPrevious
  );

  const buzzChange = setSignalValues(
    data.hackerNews,
    elements.buzzChange,
    elements.buzzCurrent,
    elements.buzzPrevious
  );

  const profile = createSignalProfile(
    data.github,
    data.hackerNews,
    buildChange,
    buzzChange
  );

  elements.resultTopic.textContent = topic;

  elements.resultPeriod.textContent =
    `${formatPeriod(periods.current)} compared with ` +
    `${formatPeriod(periods.previous)}`;

  elements.signalProfile.textContent = profile.name;

  elements.profileDescription.textContent =
    profile.description;

  renderGitHubResults(data.github);
  renderHackerNewsResults(data.hackerNews);

  const partialMessage = createPartialWarning(
    data.github,
    data.hackerNews
  );

  elements.partialWarning.textContent = partialMessage;
  elements.partialWarning.hidden = !partialMessage;

  elements.githubRateLimit.textContent =
    formatRateLimit(data.github);

  elements.errorPanel.hidden = true;
  elements.resultPanel.hidden = false;

  elements.status.classList.remove("is-loading");

  elements.status.textContent = cached
    ? "Showing a recent result saved in this browser session."
    : data.github.available &&
        data.hackerNews.available
      ? "Live comparison completed."
      : "Partial comparison completed.";

  window.dataLayer.push({
    event: "api_result",
    tool_name: "build_vs_buzz",
    github_available: data.github.available,
    hacker_news_available:
      data.hackerNews.available,
    signal_profile: profile.name,
    cached_result: cached,
  });
}


/* =========================
   SEARCH STATE
========================= */

function setLoadingState(isLoading) {
  searchInProgress = isLoading;

  elements.submitButton.disabled = isLoading;

  elements.exampleButtons.forEach((button) => {
    button.disabled = isLoading;
  });

  elements.status.classList.toggle(
    "is-loading",
    isLoading
  );

  if (isLoading) {
    elements.status.textContent =
      "Fetching GitHub and Hacker News data...";
  }
}

function showError(data) {
  const failedSources = [];

  if (!data.github.available) {
    failedSources.push("GitHub");
  }

  if (!data.hackerNews.available) {
    failedSources.push("Hacker News");
  }

  elements.resultPanel.hidden = true;
  elements.errorPanel.hidden = false;

  elements.errorMessage.textContent =
    `Unavailable sources: ${failedSources.join(" and ")}. ` +
    "Try again shortly.";

  elements.status.classList.remove("is-loading");
  elements.status.textContent =
    "The comparison could not be completed.";

  window.dataLayer.push({
    event: "api_error",
    tool_name: "build_vs_buzz",
    failed_sources: failedSources.join(", "),
  });
}

function saveTopicToUrl(topic) {
  const url = new URL(window.location.href);

  url.searchParams.set("topic", topic);

  window.history.replaceState(
    {},
    "",
    url
  );
}

function clearTopicFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete("topic");

  window.history.replaceState(
    {},
    "",
    url
  );
}

async function performSearch(rawTopic) {
  if (searchInProgress) {
    return;
  }

  const topic = cleanTopic(rawTopic);
  const validationMessage = validateTopic(topic);

  if (validationMessage) {
    elements.input.setCustomValidity(
      validationMessage
    );

    elements.input.reportValidity();
    return;
  }

  elements.input.setCustomValidity("");

  lastSearchTopic = topic;
  elements.input.value = topic;

  saveTopicToUrl(topic);

  elements.resultPanel.hidden = true;
  elements.errorPanel.hidden = true;

  setLoadingState(true);

  window.dataLayer.push({
    event: "api_search",
    tool_name: "build_vs_buzz",
    query_length: topic.length,
  });

  const cacheKey = topic.toLowerCase();
  const cachedResult = resultCache.get(cacheKey);

  if (
    cachedResult &&
    Date.now() - cachedResult.savedAt <
      CACHE_DURATION
  ) {
    renderResult(
      topic,
      cachedResult.data,
      cachedResult.periods,
      true
    );

    setLoadingState(false);
    return;
  }

  const periods = createComparisonPeriods();

  try {
    const data = await fetchCombinedSignals(
      topic,
      periods
    );

    if (
      !data.github.available &&
      !data.hackerNews.available
    ) {
      showError(data);
      return;
    }

    resultCache.set(cacheKey, {
      savedAt: Date.now(),
      data,
      periods,
    });

    renderResult(
      topic,
      data,
      periods
    );
  } catch (error) {
    console.error(error);

    showError({
      github: { available: false },
      hackerNews: { available: false },
    });
  } finally {
    setLoadingState(false);
  }
}


/* =========================
   EVENTS
========================= */

elements.form.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    performSearch(elements.input.value);
  }
);

elements.input.addEventListener(
  "input",
  () => {
    elements.input.setCustomValidity("");
  }
);

elements.exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const topic = button.dataset.topic;

    elements.input.value = topic;
    performSearch(topic);
  });
});

elements.newSearchButton.addEventListener(
  "click",
  () => {
    elements.resultPanel.hidden = true;
    elements.errorPanel.hidden = true;

    elements.status.textContent =
      "Ready for a new comparison.";

    elements.input.value = "";
    clearTopicFromUrl();

    elements.input.focus();

    window.scrollTo({
      top:
        document.getElementById("tool").offsetTop -
        90,
      behavior:
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
    });
  }
);

elements.retryButton.addEventListener(
  "click",
  () => {
    if (lastSearchTopic) {
      performSearch(lastSearchTopic);
    }
  }
);

elements.resultPanel.addEventListener(
  "click",
  (event) => {
    const sourceLink = event.target.closest(
      "a[data-source]"
    );

    if (!sourceLink) {
      return;
    }

    window.dataLayer.push({
      event: "api_source_click",
      tool_name: "build_vs_buzz",
      source_name: sourceLink.dataset.source,
    });
  }
);


/* =========================
   SHAREABLE SEARCH URL
========================= */

const initialTopic = cleanTopic(
  new URLSearchParams(
    window.location.search
  ).get("topic") || ""
);

if (initialTopic) {
  elements.input.value = initialTopic;
  performSearch(initialTopic);
}