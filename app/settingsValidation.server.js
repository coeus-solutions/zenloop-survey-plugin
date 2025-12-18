import { SURVEY_API_URL } from "./constants";

export async function validateSurveySettings(formData) {
  const orgId = formData.get("orgId");
  const surveyId = formData.get("surveyId");
  const displayType = formData.get("displayType");

  // Validate required fields
  if (!orgId || !surveyId || !displayType) {
    return { error: "All fields are required" };
  }

  // Validate numbers
  if (isNaN(orgId) || isNaN(surveyId)) {
    return { error: "Organization ID and Survey ID must be valid numbers" };
  }

  // Validate rating survey for form display type
  if (displayType === "form") {
    const surveyData = await fetchSurvey(surveyId);
    if (!surveyData || !isRatingSurvey(surveyData)) {
      return {
        error: `Unable to save display type as embedded form. Survey ${surveyId} must have a rating question.`,
      };
    }
  }

  const settings = {
    orgId,
    surveyId,
    displayType,
  };

  return { settings };
}

function isRatingSurvey(surveyData) {
  const pages = surveyData?.pages ?? [];
  const ratingSurve = pages
    .flatMap((p) => p.elements ?? [])
    .find((el) => el.type === "rating");

  return !!ratingSurve;
}

async function fetchSurvey(surveyId) {
  try {
    const endpoint = `${SURVEY_API_URL}/api/v2/surveys/public/${surveyId}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json?.surveyJson;
  } catch (err) {
    console.log("Error fetching survey: ", err);
    return null;
  }
}
