/**
 * Extend Shopify Checkout with a custom Post Purchase user experience.
 */

import React from 'react';

import {
  extend,
  render,
  BlockStack,
  Button,
  Heading,
  Layout,
  TextBlock,
  TextContainer,
  View,
  Link,
  Image,
  Separator,
} from "@shopify/post-purchase-ui-extensions-react";

const SURVEY_BASE_URL = "https://zenresponses.zenloop.com/";

// Replace with production URL when deploying the app
const APP_URL = "https://pas-offline-mile-juice.trycloudflare.com";

extend("Checkout::PostPurchase::ShouldRender", shouldRender);
render("Checkout::PostPurchase::Render", PostPurchaseSurvey);

async function shouldRender({ storage, inputData }) {
  try {
    const response = await fetchZenloopSettings(inputData?.token || "");

    if (!response.ok) {
      console.error(`Zenloop API error: ${response.status} ${response.statusText}`);
      return { render: false };
    }

    const { data } = await response.json();
    const orgId = data?.orgId;
    const surveyId = data?.surveyId;

    if (!orgId || !surveyId) {
      console.error("Invalid Zenloop settings:", data);
      return { render: false };
    }

    await storage.update({ orgId, surveyId });
    return { render: true };
  } catch (error) {
    console.error("Unexpected error in shouldRender:", error);
    return { render: false };
  }
}

// Post-purchase survey component
export function PostPurchaseSurvey({ storage, inputData, done }) {
  const { orgId = "", surveyId = "" } = storage.initialData || {};
  const surveyUrl = buildSurveyUrl(orgId, surveyId, inputData);

  return (
    <View padding="none">
      <View padding={{ start: "none", end: "none", bottom: "none", top: "base" }}>
        <Layout maxInlineSize={0.95}>
          <BlockStack spacing="loose">
            {/* Header Section */}
            <BlockStack alignment="center">
              <Separator />
              <Image
                source="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMzgiIGZpbGw9IiNGNUY1RjUiIHN0cm9rZT0iIzAwODQ2MCIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0yNCA0MkwzNCA1Mkw1NiAzMCIgc3Ryb2tlPSIjMDA4NDYwIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K"
                fit="contain"
                size="medium"
                padding={{ start: "none", end: "none", bottom: "none", top: "base" }}
              />
              <Heading>Thank You for Your Purchase! 🎉</Heading>
              <TextContainer alignment="center">
                <TextBlock emphasized size="medium">
                  We're thrilled to have you as our customer
                </TextBlock>
              </TextContainer>
            </BlockStack>

            <Separator />

            {/* Survey Section */}
            {surveyUrl ? (
              <View
                border="base"
                padding="loose"
                cornerRadius="base"
                background="subdued"
              >
                <BlockStack spacing="loose" alignment="center">
                  <TextContainer alignment="center">
                    <Heading level={2}>Your Opinion Matters</Heading>
                    <TextBlock size="medium">
                      How was your shopping experience with us?
                    </TextBlock>
                  </TextContainer>

                  <BlockStack spacing="tight" alignment="center">
                    <Link to={surveyUrl} external>
                      <Button
                        kind="primary"
                        inlineSize="fill"
                      >
                        Share Your Feedback
                      </Button>
                    </Link>

                    <TextContainer alignment="center">
                      <TextBlock size="small" emphasized appearance="subdued">
                        Takes less than 2 minutes • Your feedback is anonymous
                      </TextBlock>
                    </TextContainer>
                  </BlockStack>
                </BlockStack>
              </View>
            ) : (
              <TextContainer alignment="center">
                <TextBlock appearance="critical">
                  Unable to load survey at the moment. Please try again later.
                </TextBlock>
              </TextContainer>
            )}

            <Separator />

            {/* Footer Section */}
            <BlockStack spacing="tight" alignment="center">
              <Button
                kind="secondary"
                onPress={() => done()}
                inlineSize="fill"
              >
                Continue to Order Status
              </Button>
              <TextContainer alignment="center">
                <TextBlock size="small" appearance="subdued">
                  You can always provide feedback later from your order status page
                </TextBlock>
              </TextContainer>
            </BlockStack>
          </BlockStack>
        </Layout>
      </View>
    </View>
  );
}

function buildSurveyUrl(orgId, surveyId, inputData) {
  if (!orgId || !surveyId) return null;

  const shop = inputData?.shop || {};
  const initialPurchase = inputData?.initialPurchase || {};
  const firstItem = initialPurchase?.lineItems?.[0] || {};

  const params = new URLSearchParams({
    orgId,
    surveyId,
    shop_domain: shop.domain || "",
    order_id: initialPurchase.referenceId || "",
    customer_id: initialPurchase.customerId?.toString() || "",
    product_title: firstItem.product?.title || "",
    product_variant: firstItem.product?.variant?.title || "",
    total_price: initialPurchase.totalPriceSet?.shopMoney?.amount || "",
    currency: initialPurchase.totalPriceSet?.shopMoney?.currencyCode || "",
  });

  return `${SURVEY_BASE_URL}?${params.toString()}`;
}

async function fetchZenloopSettings(token) {
  return fetch(`${APP_URL}/api/zenloop-settings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}