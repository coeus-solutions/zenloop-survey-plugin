import { useState, useEffect } from "react";
import { SURVEY_API_URL } from "../constants";

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
  locale = "default",
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
        const endpoint = `${SURVEY_API_URL}/api/v2/surveys/public/${surveyId}`;
        const res = await fetch(endpoint, { signal });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();

        const pages = json?.surveyJson?.pages ?? [];
        const ratingSurvey = pages
          .flatMap((p: any) => p.elements ?? [])
          .find((el: any) => el.type === "rating");

        if (!ratingSurvey) {
          throw new Error("No rating question found in survey JSON.");
        }

        const title = getSurveyTitle(json.surveyJson?.title, locale);

        const config: SurveyConfig = {
          title: title ?? title ?? "",
          rateMin: ratingSurvey.rateMin ?? 0,
          rateMax: ratingSurvey.rateMax ?? 0,
          rateCount: ratingSurvey.rateCount ?? 0,
          rateType: ratingSurvey.rateType ?? "",
          minRateDescription: ratingSurvey.minRateDescription ?? "",
          maxRateDescription: ratingSurvey.maxRateDescription ?? "",
        };

        setData(config);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.log({ err });
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSurvey();
    return () => controller.abort();
  }, [surveyId, locale]);

  return { data, error, loading };
}

function getSurveyTitle(title: string | object, locale: string): string {
  if (typeof title === "string") return title;
  const [language] = locale.split("-");

  if (language in title) return title[language];

  return title["default"];
}
