import type { OrderConfirmationApi } from "@shopify/ui-extensions/checkout";
import { SingleLink } from "./components/SingleLink";
import { buildSurveyUrl, getSettings, buildNPSSurveyUrl } from "./utils";
import { LabelForm, StarForm, SmileyForm } from "./components";
import {
  reactExtension,
  useShop,
  useAppMetafields,
  useApi,
  View,
  BlockStack,
  Heading,
  Grid,
  Text,
  Spinner,
} from "@shopify/ui-extensions-react/checkout";
import { useSurveyConfig } from "./hooks/useSurveyConfig";


export default reactExtension("purchase.thank-you.block.render", () => (<Extension />));

function Extension() {
  const shop = useShop();
  const { orderConfirmation } = useApi() as OrderConfirmationApi;
  const order = orderConfirmation.current.order;
  const metafields = useAppMetafields({ namespace: "zenloop", key: "settings" })
  const settings = getSettings(metafields[0]?.metafield)
  const surveyId = settings?.surveyId ?? null;
  const { data: surveyConfig, loading, error } = useSurveyConfig(surveyId);


  if (!settings) return null;
  if (loading) return <Spinner />;

  if (settings.displayType !== "form" || error || !surveyConfig) {
    const surveyUrl = buildSurveyUrl(settings, shop.myshopifyDomain, order.id);
    return <SingleLink surveyUrl={surveyUrl} />;
  }

  const surveyUrl = buildNPSSurveyUrl(settings, shop.myshopifyDomain, order.id);
  let formComponent: JSX.Element;

  switch (surveyConfig.rateType) {
    case 'smileys':
      formComponent = <SmileyForm surveyUrl={surveyUrl} rateCount={surveyConfig.rateCount} />;
      break;
    case 'stars':
      formComponent = <StarForm surveyUrl={surveyUrl} rateCount={surveyConfig.rateCount} />
      break;
    default:
      formComponent = <LabelForm surveyUrl={surveyUrl} rateCount={surveyConfig.rateCount} />
  }

  return (
    <View border={"base"} padding={"base"}>
      <BlockStack>
        <View padding={"tight"}>
          <Heading level={2}>{surveyConfig.title}</Heading>
        </View>

        {formComponent}

        <Grid columns={['50%', 'fill']} padding={"base"} spacing={"extraTight"}>
          <View inlineAlignment={"start"}>
            <Text appearance={"subdued"} size={"small"}>{surveyConfig.minRateDescription}</Text>
          </View>
          <View inlineAlignment={"end"}>
            <Text appearance={"subdued"} size={"small"}>{surveyConfig.maxRateDescription}</Text>
          </View>
        </Grid>
      </BlockStack>
    </View>
  );
}