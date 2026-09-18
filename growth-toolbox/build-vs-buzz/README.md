# Build vs Buzz

Build vs Buzz is an interactive web application that compares two public signals around an emerging technology topic:

- Newly created GitHub repositories
- Published Hacker News stories

The tool is part of the Growth Toolbox portfolio section in Erik Hjelmström’s Growth Marketing program at Berghs.

## Purpose

The purpose is to explore whether visible building activity and online conversation around a topic are developing in the same direction.

The tool does not measure revenue, adoption or total market demand. It provides two directional signals that can support further research.

## Data sources

### GitHub Search API

The application uses the GitHub Search API to count repositories created during each period.

The search is limited to the exact topic phrase in:

- Repository names
- Repository descriptions
- Repository topics

Documentation:

https://docs.github.com/en/rest/search/search

### Hacker News Search API

The application uses the Hacker News API provided by Algolia to count published stories containing the selected search topic.

Documentation:

https://hn.algolia.com/api

## Comparison method

The application compares two equally sized periods:

- Current period: the latest 30 complete UTC days
- Previous period: the preceding 30 complete UTC days

The current period ends yesterday so that incomplete data from the current day is excluded.

Each source is compared only with itself:

- Current GitHub count versus previous GitHub count
- Current Hacker News count versus previous Hacker News count

The raw counts from GitHub and Hacker News are not treated as equivalent units.

## Stability threshold

Changes between minus five and plus five percent are classified as stable.

A change must be greater than five percent to be classified as increasing, or lower than minus five percent to be classified as decreasing.

The interface still displays the actual rounded percentage change.

## Signal profiles

The direction of both sources creates a descriptive profile:

- Shared momentum
- Building ahead of buzz
- Buzz ahead of building
- Cooling signal
- Build steady, buzz cooling
- Buzz steady, build cooling
- Stable signal
- Mixed signal
- No visible signal
- Partial signal

These profiles describe the observed API results. They are not predictions or proof of market growth.

## Application features

- Live requests to two public APIs
- Equal date-window comparison
- Exact-phrase GitHub search
- Five-percent stability threshold
- Responsive desktop and mobile layout
- Loading, empty, partial and error states
- Five-minute in-memory result cache
- Shareable topic URLs
- Links to recent source results
- GitHub rate-limit information
- Reduced-motion support
- Accessible status messages

## Analytics events

The application pushes the following custom events to `dataLayer`:

- `api_tool_view`
- `api_search`
- `api_result`
- `api_error`
- `api_source_click`

No entered search term is included in the analytics event data.

## Testing completed

The application has been tested for:

- Successful results from both APIs
- Topics with no visible results
- Shareable topic URLs
- External source links
- Desktop layout
- Mobile layout
- Keyboard-accessible form controls
- GitHub request limits
- Partial and unavailable data handling in the application logic

## Local use

Run the portfolio through a local development server and open:

```text
growth-toolbox/build-vs-buzz/index.html
```

The application requires an internet connection to contact the public APIs.