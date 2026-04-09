import { SCORING_CATEGORIES } from "./scoring";

const introHtml = `
<div class="weighted-demo-intro">
  <p>This demo shows <strong>weighted scoring</strong> across strategic categories (Purpose, Vision, Mission, Values).</p>
  <ul>
    <li>Each category has a <strong>score</strong> (0–10) and a <strong>base weight</strong> (share of 100% among applicable categories before re-normalization).</li>
    <li><strong>Not applicable</strong> categories are excluded: their weight is treated as 0 and they do not affect the total.</li>
    <li>Remaining applicable categories have their base weights <strong>re-normalized</strong> so normalized weights sum to 100%.</li>
    <li>Overall score: <code>sum(normalized_weight_i × score_i)</code>.</li>
  </ul>
  <p><strong>Example:</strong> Base weights Purpose 0%, Vision / Mission / Values each 33.33%. If Purpose is N/A or has 0% base weight, only Vision, Mission, and Values contribute—each ends up with normalized weight ⅓, matching <code>(vision × ⅓) + (mission × ⅓) + (values × ⅓)</code>.</p>
</div>
`;

function categoryPanels() {
  return SCORING_CATEGORIES.map((c) => {
    const pct = (c.baseWeight * 100).toFixed(2);
    return {
      type: "panel",
      name: `${c.key}-panel`,
      title: c.title,
      description: `Base weight in the declared-weight model: ${pct}% (among applicable categories, before re-normalization).`,
      elements: [
        {
          type: "radiogroup",
          name: `${c.key}Applicable`,
          title: "Does this category apply to your assessment?",
          isRequired: true,
          choices: [
            { value: true, text: "Applicable — include in scoring" },
            { value: false, text: "Not applicable" },
          ],
          defaultValue: true,
        },
        {
          type: "rating",
          name: `${c.key}Score`,
          title: "Score for this category (0–10)",
          description: "Only counts when the category is applicable.",
          isRequired: true,
          rateMin: 0,
          rateMax: 10,
          rateStep: 1,        
          visibleIf: `{${c.key}Applicable} = true`,
        },
      ],
    };
  });
}

export const json = {
  title: "Weighted category scoring demo",
  showQuestionNumbers: "off",
  pages: [
    {
      name: "setup",
      title: "How scoring works",
      elements: [
        {
          type: "html",
          name: "intro",
          html: introHtml,
        },
        {
          type: "radiogroup",
          name: "weightingMode",
          title: "Weighting mode",
          isRequired: true,
          choices: [
            {
              value: "renormalize",
              text: "Declared base weights — re-normalize over applicable categories (N/A → weight 0)",
            },
            {
              value: "equal",
              text: "Equal split — each applicable category gets weight 1 ÷ (number of applicable categories)",
            },
          ],
          defaultValue: "renormalize",
        },
      ],
    },
    {
      name: "categories",
      title: "Category scores",
      description: "Mark N/A where a category does not apply; those categories have zero impact on the final score.",
      elements: categoryPanels(),
    },
  ],
  completedHtml: "<p>Results</p>",
};
