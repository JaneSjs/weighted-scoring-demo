import React, { useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import * as SurveyTheme from "survey-core/themes";
import "./index.css";
import { json } from "./json";
import { computeWeightedOutcome, formatOutcomeAsHtml } from "./scoring";

function SurveyComponent() {
  const survey = useMemo(() => {
    const s = new Model(json);
    s.applyTheme(SurveyTheme.SharpLight);

    s.onCompleting.add((sender) => {
      const mode = sender.data.weightingMode === "equal" ? "equal" : "renormalize";
      const outcome = computeWeightedOutcome(sender.data, mode);
      sender.completedHtml = formatOutcomeAsHtml(outcome);
    });

    s.onComplete.add((sender) => {
      const mode = sender.data.weightingMode === "equal" ? "equal" : "renormalize";
      const outcome = computeWeightedOutcome(sender.data, mode);
      console.log("Survey data:", JSON.stringify(sender.data, null, 2));
      console.log("Weighted outcome:", outcome);
    });

    return s;
  }, []);

  return <Survey model={survey} />;
}

export default SurveyComponent;
