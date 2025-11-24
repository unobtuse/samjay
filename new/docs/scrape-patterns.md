# Scrape Patterns & Selectors

This document defines the DOM structures and CSS selectors required to extract hero asset data (Image, Logo, Description) from supported streaming platforms.

## HBO Max / Max

**Target Data:**
- **Hero Image**: Background image of the main hero container.
- **Logo**: Title treatment/logo image overlay.
- **Description**: Synopsis text.
- **Metadata**: Title, Rating, Year, Genre, Type (Series/Movie), Network.

**Selectors:**

| Data Point | CSS Selector | Notes |
| :--- | :--- | :--- |
| **Hero Container** | `.max-section-stlp-hero-parent` | The background-image property of this div contains the hero art. |
| **Logo** | `.initial-img-wrapper img` | The image inside this wrapper is the title logo. |
| **Description** | `<p>` sibling of metadata | The main synopsis text, usually following the metadata block. |
| **Metadata** | `<h6>` elements | Sequential `<h6>` tags contain: Rating, Year, Genre, Type. Order matters. |
| **Title** | `<strong>` | The main title text, often highlighting the show name. |

**Example URL:**
`https://www.hbomax.com/movies/sam-jay-salute-me-or-shoot-me/1f4202b7-4d01-45cc-b4d2-11752f2e1009`

---

## Netflix

**Target Data:**
- **Hero Image**: First `<img>` in the main content area (often webp).
- **Logo**: Second or Third `<img>` (often webp, title treatment).
- **Description**: `<div class="title-info-synopsis">` or just the text block following metadata.
- **Metadata**: List of items (Year, Rating, Duration) usually in a `<ul>` or `<span>` sequence.

**Selectors:**

| Data Point | CSS Selector | Notes |
| :--- | :--- | :--- |
| **Hero Container** | `.hero-image` or first `img` | Standard `<img>` tag, often webp. The very first image on the page. |
| **Logo** | 3rd `img` in DOM | The 2nd image is usually the 'N' logo. The 3rd is the Show Title. |
| **Description** | `.synopsis` | Main text block. |
| **Metadata** | `.metadata-list` | Year, Maturity Rating, Duration. |

**Example URL:**
`https://www.netflix.com/title/81078802`
