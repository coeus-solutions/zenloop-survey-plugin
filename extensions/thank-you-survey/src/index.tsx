import {
  reactExtension,
  BlockStack,
  View,
  Link,
  useShop,
  useAppMetafields,
  TextBlock,
  Heading,
  Button,
  useApi,
} from "@shopify/ui-extensions-react/checkout";

import type { AppMetafield, OrderConfirmationApi } from "@shopify/ui-extensions/checkout";

type Settings = {
  orgId: string,
  surveyId: string
};


const SURVEY_BASE_URL = "https://zenresponses.zenloop.com/";

export default reactExtension("purchase.thank-you.block.render", () => (<Extension />));

function Extension() {
  console.log("Here")
  const shop = useShop();
  const { orderConfirmation } = useApi() as OrderConfirmationApi;
  const order = orderConfirmation.current.order;

  const metafields = useAppMetafields({ namespace: "zenloop", key: "settings" })

  console.log(metafields);

  const settings = getSettings(metafields[0]?.metafield)

  if (!settings) {
    return null;
  }

  const surveyUrl = buildSurveyUrl(settings, shop.myshopifyDomain, order.id);

  return (
    <View
      border="base"
      padding="loose"
      cornerRadius="base"
      background="subdued"
    >
      <BlockStack spacing="loose" inlineAlignment="center">
        <Heading level={2}>Your Opinion Matters</Heading>
        <TextBlock size="medium">
          How was your shopping experience with us?
        </TextBlock>

        <BlockStack spacing="tight" inlineAlignment="center">
          <Link to={surveyUrl} external>
            <Button kind="primary">
              Share Your Feedback
            </Button>
          </Link>


          <TextBlock size="small" appearance="subdued">
            Takes less than 2 minutes • Your feedback is anonymous
          </TextBlock>
        </BlockStack>
      </BlockStack>
    </View>
  );
}

function buildSurveyUrl(settings: Settings, shop: string, orderId: string) {
  const { orgId, surveyId } = settings;

  const params = new URLSearchParams({
    orgId,
    surveyId,
    shop_domain: shop,
    order_id: orderId,
  });

  return `${SURVEY_BASE_URL}?${params.toString()}`;
}

function getSettings(metafield?: AppMetafield): Settings | null {
  if (!metafield?.value) {
    return null;
  }

  try {
    const zenloopSettings = JSON.parse(String(metafield.value));

    const orgId = zenloopSettings?.orgId;
    const surveyId = zenloopSettings?.surveyId;

    if (!orgId || !surveyId) {
      return null
    }

    return { orgId, surveyId }
  } catch {
    return null;
  }
}