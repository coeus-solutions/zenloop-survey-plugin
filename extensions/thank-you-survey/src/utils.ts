import type { AppMetafield } from "@shopify/ui-extensions/checkout";
import { SURVEY_BASE_URL } from "./constants";

type Settings = {
  orgId: string;
  surveyId: string;
};

export function buildSurveyUrl(
  settings: Settings,
  shop: string,
  orderId: string,
) {
  const { orgId, surveyId } = settings;

  const params = new URLSearchParams({
    orgId,
    surveyId,
    shop_domain: shop,
    order_id: orderId,
  });

  return `${SURVEY_BASE_URL}?${params.toString()}`;
}

export function buildNPSSurveyUrl(
  settings: Settings,
  shop: string,
  orderId: string,
) {
  const { orgId, surveyId } = settings;

  const params = new URLSearchParams({
    orgId,
    surveyId,
    shop_domain: shop,
    order_id: orderId,
  });

  return `${SURVEY_BASE_URL}?${params.toString()}`;
}

export function getSettings(metafield?: AppMetafield): Settings | null {
  if (!metafield?.value) {
    return null;
  }

  try {
    const zenloopSettings = JSON.parse(String(metafield.value));

    const orgId = zenloopSettings?.orgId;
    const surveyId = zenloopSettings?.surveyId;

    if (!orgId || !surveyId) {
      return null;
    }

    return { orgId, surveyId };
  } catch {
    return null;
  }
}
