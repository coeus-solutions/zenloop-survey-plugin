import { useState, useEffect } from "react";
import { SURVEY_BASE_URL } from "../constants";

type UseSurveyConfigResult = {
  data: SurveyConfig | null;
  error: Error | null;
  loading: boolean;
};

type SurveyConfig = {
  title: string;
  rateMin: number;
  rateMax: number;
  rateCount: number;
  rateType: string;
  minRateDescription: string;
  maxRateDescription: string;
};

export function useSurveyConfig(
  surveyId: string | null,
): UseSurveyConfigResult {
  const [data, setData] = useState<SurveyConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!surveyId) return;
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchSurvey() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `${SURVEY_BASE_URL}/api/v2/surveys/public/${surveyId}`;
        const res = await fetch(endpoint, { signal });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();

        const pages = json?.surveyJson?.pages ?? [];
        const npsSurvey = pages
          .flatMap((p: any) => p.elements ?? [])
          .find((el: any) => el.type === "rating" && el.ratingType === "NPS");

        if (!npsSurvey) {
          throw new Error("No rating question found in survey JSON.");
        }

        const config: SurveyConfig = {
          title: json.surveyJson?.title ?? npsSurvey.title ?? "",
          rateMin: npsSurvey.rateMin ?? 0,
          rateMax: npsSurvey.rateMax ?? 0,
          rateCount: npsSurvey.rateCount ?? 0,
          rateType: npsSurvey.rateType ?? "",
          minRateDescription: npsSurvey.minRateDescription ?? "",
          maxRateDescription: npsSurvey.maxRateDescription ?? "",
        };

        setData(config);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSurvey();
    return () => controller.abort();
  }, [surveyId]);

  return { data, error, loading };
}
