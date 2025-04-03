/**
 * Extend Shopify Checkout with a custom Post Purchase user experience.
 */
import React, { useEffect, useState } from 'react';

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
  useExtensionInput,
} from "@shopify/post-purchase-ui-extensions-react";

/**
 * Entry point for the `ShouldRender` Extension Point.
 */
extend("Checkout::PostPurchase::ShouldRender", async ({ storage, inputData }) => {
  const shop = inputData?.shop;
  try {
    const shopMetafields = shop?.metafields || [];
    const zenloopSettings = shopMetafields.find(
      metafield => metafield.namespace === "zenloop" && metafield.key === "settings"
    );

    if (!zenloopSettings?.value) {
      return { render: false };
    }

    let settings = {};
    try {
      settings = JSON.parse(zenloopSettings.value);
    } catch (parseError) {
      console.error("Failed to parse settings:", parseError);
      return { render: false };
    }

    const { orgId, surveyId } = settings;
    if (!orgId || !surveyId) {
      console.error("Missing required settings");
      return { render: false };
    }

    await storage.update({
      orgId,
      surveyId,
      shop: shop?.domain
    });

    return { render: true };
  } catch (error) {
    console.error("Error in ShouldRender:", error);
    return { render: false };
  }
});

// Post-purchase survey component
function PostPurchaseSurvey() {
  const { storage, inputData, done } = useExtensionInput();
  const [shouldRender, setShouldRender] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const shop = inputData?.shop;
  const initialPurchase = inputData?.initialPurchase;

  useEffect(() => {
    async function checkSettings() {
      try {
        const shopMetafields = shop?.metafields || [];
        const zenloopSettings = shopMetafields.find(
          metafield => metafield.namespace === "zenloop" && metafield.key === "settings"
        );

        if (!zenloopSettings?.value) {
          done();
          return;
        }

        try {
          const parsedSettings = JSON.parse(zenloopSettings.value);
          const { orgId, surveyId } = parsedSettings;

          if (!orgId || !surveyId) {
            done();
            return;
          }

          await storage.update({
            orgId,
            surveyId,
            shop: shop?.domain
          });

          setSettings({ orgId, surveyId });
          setShouldRender(true);
        } catch (parseError) {
          console.error("Failed to parse settings:", parseError);
          done();
        }
      } catch (error) {
        console.error("Error checking settings:", error);
        setError("Unable to load survey. Please continue to order status.");
        setShouldRender(true);
      }
    }

    checkSettings();
  }, [shop, storage, done]);

  if (!shouldRender) {
    return null;
  }

  if (error || !settings) {
    return (
      <View padding="base">
        <Layout maxInlineSize={0.95}>
          <BlockStack spacing="tight" alignment="center">
            <TextContainer alignment="center">
              <TextBlock appearance="critical">{error}</TextBlock>
            </TextContainer>
            <Button
              kind="secondary"
              onPress={() => done()}
              inlineSize="fill"
            >
              Continue to Order Status
            </Button>
          </BlockStack>
        </Layout>
      </View>
    );
  }
  
  const baseUrl = "https://zenresponses.zenloop.com/";
  const params = new URLSearchParams({
    orgId: settings.orgId,
    surveyId: settings.surveyId,
    shop_domain: shop?.domain || "",
    order_id: initialPurchase?.referenceId || "",
    customer_id: initialPurchase?.customerId?.toString() || "",
    product_title: initialPurchase?.lineItems?.[0]?.product?.title || "",
    product_variant: initialPurchase?.lineItems?.[0]?.product?.variant?.title || "",
    total_price: initialPurchase?.totalPriceSet?.shopMoney?.amount || "",
    currency: initialPurchase?.totalPriceSet?.shopMoney?.currencyCode || "",
  });
  const surveyUrl = `${baseUrl}?${params.toString()}`;

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

// Render the post-purchase extension
render("Checkout::PostPurchase::Render", () => <PostPurchaseSurvey />);