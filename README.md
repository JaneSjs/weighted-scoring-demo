# Weighted scoring demo (SurveyJS + React)

This demo shows how to create a **weighted category score** with **“not applicable” (N/A) handling** and a **dynamic completion summary** using the [SurveyJS Form Library](https://surveyjs.io/form-library/documentation/get-started-react) in a React app. Respondents choose whether each category applies, enter a 0–10 score when it does, pick a weighting mode, and see an HTML breakdown of base weights, normalized weights, per-category contributions, and the overall weighted result.

**Live demo:** [https://janeSjs.github.io/weighted-scoring-demo](https://janeSjs.github.io/weighted-scoring-demo)  
**Repository:** [github.com/JaneSjs/weighted-scoring-demo](https://github.com/JaneSjs/weighted-scoring-demo)

---

## What the demo illustrates

- **Declarative survey UI** defined as JSON (pages, panels, `radiogroup`, `rating`, `html`, `visibleIf`).
- **Conditional questions** so scores appear only when a category is marked applicable.
- **Post-processing on completion** via `Model` events: compute business rules in plain JavaScript, then inject a rich **completed page** by assigning `completedHtml`.
- **GitHub Pages** deployment with **GitHub Actions** (build on Node 24, publish the `build` output).

---

## Scoring rules (business logic)

### Categories and base weights

Default categories are defined in `src/scoring.js` as `SCORING_CATEGORIES`:

| Category | Base weight (declared-weight mode) |
| -------- | ----------------------------------- |
| Purpose  | 0                                   |
| Vision   | ⅓                                   |
| Mission  | ⅓                                   |
| Values   | ⅓                                   |

### Applicability

- Each category has a required **Applicable / Not applicable** answer (`{key}Applicable`).
- **Not applicable** categories are excluded from scoring: they behave as **weight 0** and do not affect the total.

### Weighting modes

1. **Declared base weights (`renormalize`)**  
   Among **applicable** categories only, sum their **base weights**. Each applicable category receives:

   ```
   normalized_weight[i] = base_weight[i] / sum(base_weight[j] for all applicable j)
   ```

   So remaining weights sum to **100%**. N/A categories are left out of that sum.

   If the sum of base weights among applicable categories is **0** (e.g. only “Purpose” remains applicable and its base weight is 0), the demo **falls back** to **equal** weights across applicable categories so a score can still be computed.

2. **Equal split (`equal`)**  
   Each **applicable** category gets weight `1 / n`, where `n` is the count of applicable categories.

### Overall score

Scores are on a **0–10** scale per applicable category. The overall result is:

```
overall = sum over i of (normalized_weight[i] * score[i])
```

Only **applicable** categories with a score contribute. If **no** category is applicable, the completion page explains that no overall score is computed.

---

## Implementation details

### Tech stack

| Piece | Role |
| ----- | ---- |
| **React** (`react`, `react-dom`) | UI host for the survey. |
| **`survey-core`** | `Model`, themes, survey JSON schema, events (`onCompleting`, `onComplete`). |
| **`survey-react-ui`** | `<Survey model={…} />` component. |
| **`react-scripts`** | Create React App toolchain (`start`, `build`, `test`). |

### Project layout

| Path | Purpose |
| ---- | ------- |
| `src/index.js` | React entry; mounts the app on `#surveyElement`. |
| `src/SurveyComponent.jsx` | Creates a **single** `Model` instance with `useMemo`, applies **Sharp Light** theme, wires **completion** handlers. |
| `src/json.js` | Survey **JSON**: intro HTML, `weightingMode` question, dynamically generated **panels** from `SCORING_CATEGORIES`. |
| `src/scoring.js` | **Pure functions**: `computeWeightedOutcome`, `formatOutcomeAsHtml`; category config `SCORING_CATEGORIES`. |
| `src/index.css` | Styles for the intro block and the results table on the completed page. |
| `public/index.html` | Host page with root `#surveyElement`. |
| `.github/workflows/deploy-github-pages.yml` | CI: `npm ci` → `npm run build` → deploy `build/` to GitHub Pages. |

### Survey model (`src/json.js`)

- **Page “setup”**  
  - `html` element: explains weighted scoring and N/A behavior.  
  - `radiogroup` `weightingMode`: `renormalize` vs `equal`.

- **Page “categories”**  
  - For each entry in `SCORING_CATEGORIES`, a **panel** is generated with:
    - `{key}Applicable` — required boolean choice (stored as `true` / `false`).
    - `{key}Score` — **rating** `rateMin: 0`, `rateMax: 10`, `rateStep: 1`, **required when visible**, shown only when `visibleIf: "{key}Applicable = true"` (with each real key substituted, e.g. `purposeApplicable`).

- **`completedHtml`** in JSON is a placeholder; the real content is set in code (see below).

### React integration (`src/SurveyComponent.jsx`)

- **`useMemo(() => new Model(json), [])`**  
  Avoids recreating the `Model` on every render (which would reset state and duplicate event handlers).

- **`survey.applyTheme(SurveyTheme.SharpLight)`**  
  Applies a built-in SurveyJS theme.

- **`onCompleting`**  
  Runs **before** the survey is marked complete. It:
  1. Reads `sender.data.weightingMode` and maps it to `renormalize` or `equal`.
  2. Calls `computeWeightedOutcome(sender.data, mode)`.
  3. Sets **`sender.completedHtml = formatOutcomeAsHtml(outcome)`** so the user sees a custom HTML summary (table + overall score).

- **`onComplete`**  
  Logs final `sender.data` and the computed outcome to the browser console (useful for debugging or piping to analytics).

### Scoring module (`src/scoring.js`)

- **`computeWeightedOutcome(data, mode, categories?)`**  
  Implements normalization, equal mode, zero–sum base-weight fallback, and the weighted sum. Returns `{ overall, mode, rows, message? }`.

- **`formatOutcomeAsHtml(outcome)`**  
  Builds safe HTML for category names via `escapeHtml`; numeric fields are formatted for display.

- **Extending categories**  
  Add or edit objects in `SCORING_CATEGORIES` (`key`, `title`, `baseWeight`).  
  `src/json.js` imports the same array to keep the **form** and **math** in sync.

### GitHub Pages

- **`homepage`** in `package.json` is set to `https://janeSjs.github.io/weighted-scoring-demo` so Create React App emits correct **asset paths** for a project site (subpath under `github.io`).

- **Repository settings:** **Settings → Pages → Build and deployment → Source: GitHub Actions.**

- **Workflow:** On push to **`main`** (or manual **workflow_dispatch**), the workflow runs `npm ci`, `npm run build`, uploads `build/` with `actions/upload-pages-artifact`, and deploys with `actions/deploy-pages`.  
  Actions use **Node 24** (`actions/checkout@v6`, `actions/setup-node@v6`) to align with current GitHub Actions runtime guidance.

If you rename the repository, update **`homepage`** in `package.json` to `https://<user>.github.io/<repo>/` and push again.

---

## Local development

Prerequisites: **Node.js** (LTS 20+ or 24+ recommended) and **npm**.

```bash
npm install
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000) with hot reload.

```bash
npm run build
```

Produces an optimized build in `build/` (same output CI deploys).

---

## SurveyJS resources

- [Form Library — React](https://surveyjs.io/form-library/documentation/get-started-react)  
- [Survey JSON schema / question types](https://surveyjs.io/form-library/documentation/design-survey-create-a-simple-survey)  
- [Conditional visibility (`visibleIf`)](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic)  
- [Survey API (`Model`, events)](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model)

---

## License

This sample project is provided as a demonstration. SurveyJS libraries are subject to their respective licenses; see [SurveyJS licensing](https://surveyjs.io/licensing).
