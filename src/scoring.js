/**
 * Weighted scoring with N/A categories:
 * - N/A categories get effective weight 0 and do not affect the total.
 * - Remaining applicable categories' base weights are re-normalized to sum to 1.
 * - Optional "equal" mode: each applicable category gets weight 1 / count(applicable).
 */

export const SCORING_CATEGORIES = [
  { key: "purpose", title: "Purpose", baseWeight: 0 },
  { key: "vision", title: "Vision", baseWeight: 1 / 3 },
  { key: "mission", title: "Mission", baseWeight: 1 / 3 },
  { key: "values", title: "Values", baseWeight: 1 / 3 },
];

function isApplicable(data, key) {
  const v = data[`${key}Applicable`];
  return v !== false;
}

function getScore(data, key) {
  const s = data[`${key}Score`];
  const n = typeof s === "number" ? s : parseFloat(String(s), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Record<string, unknown>} data - survey.data
 * @param {"renormalize" | "equal"} mode
 * @param {typeof SCORING_CATEGORIES} categories
 */
export function computeWeightedOutcome(data, mode, categories = SCORING_CATEGORIES) {
  const applicableKeys = categories.filter((c) => isApplicable(data, c.key)).map((c) => c.key);

  if (applicableKeys.length === 0) {
    return {
      overall: null,
      mode,
      rows: [],
      message: "No categories are marked applicable, so no overall score is computed.",
    };
  }

  /** @type {Record<string, number>} */
  const normalizedWeight = {};
  for (const c of categories) {
    normalizedWeight[c.key] = 0;
  }

  if (mode === "equal") {
    const w = 1 / applicableKeys.length;
    for (const key of applicableKeys) {
      normalizedWeight[key] = w;
    }
  } else {
    let sumBase = 0;
    for (const c of categories) {
      if (isApplicable(data, c.key)) {
        sumBase += c.baseWeight;
      }
    }
    if (sumBase > 0) {
      for (const c of categories) {
        if (isApplicable(data, c.key)) {
          normalizedWeight[c.key] = c.baseWeight / sumBase;
        }
      }
    } else {
      const w = 1 / applicableKeys.length;
      for (const key of applicableKeys) {
        normalizedWeight[key] = w;
      }
    }
  }

  let overall = 0;
  const rows = categories.map((c) => {
    const app = isApplicable(data, c.key);
    const score = app ? getScore(data, c.key) : null;
    const w = app ? normalizedWeight[c.key] : 0;
    const contribution = app && score != null ? w * score : 0;
    if (app && score != null) {
      overall += contribution;
    }
    return {
      key: c.key,
      title: c.title,
      applicable: app,
      baseWeight: c.baseWeight,
      normalizedWeight: w,
      score,
      contribution,
    };
  });

  return { overall, mode, rows, message: null };
}

export function formatOutcomeAsHtml(outcome) {
  if (outcome.message) {
    return `<div class="weighted-result"><p>${outcome.message}</p></div>`;
  }

  const modeLabel =
    outcome.mode === "equal"
      ? "Equal weight per applicable category (1 ÷ count applicable)"
      : "Base weights re-normalized over applicable categories only";

  const rowsHtml = outcome.rows
    .map((r) => {
      const app = r.applicable ? "Yes" : "No (excluded)";
      const basePct = (r.baseWeight * 100).toFixed(2) + "%";
      const normPct = (r.normalizedWeight * 100).toFixed(2) + "%";
      const score = r.score == null ? "—" : String(r.score);
      const contrib =
        r.applicable && r.score != null ? r.contribution.toFixed(3) : "0 (N/A)";
      return `<tr>
        <td>${escapeHtml(r.title)}</td>
        <td>${app}</td>
        <td>${basePct}</td>
        <td>${normPct}</td>
        <td>${score}</td>
        <td>${contrib}</td>
      </tr>`;
    })
    .join("");

  const overall = outcome.overall.toFixed(3);

  return `<div class="weighted-result">
    <h2>Weighted overall score</h2>
    <p class="weighted-result__overall"><strong>${overall}</strong> <span class="weighted-result__scale">(scale 0–10; weighted sum of category scores)</span></p>
    <p class="weighted-result__mode"><em>${escapeHtml(modeLabel)}</em></p>
    <table class="weighted-result__table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Applicable</th>
          <th>Base weight</th>
          <th>Normalized weight</th>
          <th>Score (0–10)</th>
          <th>Contribution (w × score)</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
