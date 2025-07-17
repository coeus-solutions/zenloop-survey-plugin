import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { authenticate } from "../../shopify.server";
import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  TextField,
  BlockStack,
  PageActions,
  Banner,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export const loader = async ({ request }) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const { admin, billing } = await authenticate.admin(request);

    // Check for active subscription first
    const billingCheck = await billing.check({
      plans: [
        "install-for-free",
        "starter", 
        "growth",
        "enterprise"
      ],
      isTest: true, // Set to false in production
    });

    // If no active subscription, redirect to plan selection page
    if (!billingCheck.hasActivePayment) {
      const url = new URL(request.url);
      const shop = url.searchParams.get('shop') || billing.shop?.domain;
      
      if (shop) {
        const shopHandle = shop.replace('.myshopify.com', '');
        const planSelectionUrl = `https://admin.shopify.com/store/${shopHandle}/charges/zenloop-surveys-1/pricing_plans`;
        throw redirect(planSelectionUrl);
      }
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const embedded = url.searchParams.get('embedded');
    const host = url.searchParams.get('host');

    if (!shop || !embedded || !host) {
      return json({ 
        settings: {},
        initialized: false
      });
    }

    const retryGraphQL = async (query, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await admin.graphql(query);
          return await response.json();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    try {
      const shopData = await retryGraphQL(`
        {
          shop {
            id
          }
        }
      `);

      if (!shopData?.data?.shop?.id) {
        return json({ 
          settings: {},
          initialized: false
        });
      }

      const data = await retryGraphQL(`
        {
          shop {
            metafield(namespace: "zenloop", key: "settings") {
              value
            }
          }
        }
      `);

      let settings = {};
      const metafieldValue = data?.data?.shop?.metafield?.value;

      if (metafieldValue) {
        try {
          settings = JSON.parse(metafieldValue);
        } catch (error) {
          return json({ 
            settings: {},
            initialized: false,
            error: "Invalid settings format. Please try saving your settings again."
          });
        }
      }

      return json({ 
        settings,
        initialized: !!metafieldValue
      });

    } catch (graphqlError) {
      return json({ 
        settings: {},
        initialized: false
      });
    }
  } catch (error) {
    return json({ 
      error: "Authentication failed. Please refresh the page." 
    }, { status: 401 });
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const orgId = formData.get("orgId");
    const surveyId = formData.get("surveyId");

    if (!orgId || !surveyId) {
      return json(
        { error: "Organization ID and Survey ID are required" },
        { status: 400 }
      );
    }

    try {
      const shopResponse = await admin.graphql(
        `query {
          shop {
            id
          }
        }`
      );

      const shopData = await shopResponse.json();
      const shopId = shopData?.data?.shop?.id;
      
      if (!shopId) {
        return json({ error: "Could not get shop ID" }, { status: 500 });
      }
      
      const response = await admin.graphql(
        `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            metafields: [{
              namespace: "zenloop",
              key: "settings",
              value: JSON.stringify({ orgId, surveyId }),
              type: "json",
              ownerId: shopId
            }]
          }
        }
      );

      const data = await response.json();

      if (data?.data?.metafieldsSet?.userErrors?.length > 0) {
        const error = data.data.metafieldsSet.userErrors[0];
        return json({ error: error.message }, { status: 400 });
      }

      if (!data?.data?.metafieldsSet?.metafields?.length) {
        return json({ error: "Failed to save settings" }, { status: 500 });
      }

      return json({
        success: true,
        settings: { orgId, surveyId }
      });

    } catch (graphqlError) {
      return json({ 
        error: "Failed to save settings. Please try again." 
      }, { status: 500 });
    }
  } catch (error) {
    return json({ 
      error: "Authentication failed. Please refresh the page." 
    }, { status: 401 });
  }
};

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [orgId, setOrgId] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [orgIdError, setOrgIdError] = useState("");
  const [surveyIdError, setSurveyIdError] = useState("");

  useEffect(() => {
    if (loaderData?.settings) {
      setOrgId(loaderData.settings.orgId || "");
      setSurveyId(loaderData.settings.surveyId || "");
    }
  }, [loaderData]);

  // Update form when action is successful
  useEffect(() => {
    if (actionData?.success && actionData?.settings) {
      setOrgId(actionData.settings.orgId);
      setSurveyId(actionData.settings.surveyId);
    }
  }, [actionData]);

  const isLoading = navigation.state === "submitting";

  const handleOrgIdChange = (value) => {
    if (value === "" || /^\d*$/.test(value)) {
      setOrgId(value);
      setOrgIdError("");
    } else {
      setOrgIdError("Please enter numbers only");
    }
  };

  const handleSurveyIdChange = (value) => {
    if (value === "" || /^\d*$/.test(value)) {
      setSurveyId(value);
      setSurveyIdError("");
    } else {
      setSurveyIdError("Please enter numbers only");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orgIdError && !surveyIdError) {
      const formData = new FormData(e.currentTarget);
      formData.set("orgId", orgId);
      formData.set("surveyId", surveyId);
      submit(formData, { method: "post" });
    }
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd">
                Zenloop Settings
              </Text>
              
              {!loaderData?.initialized && !actionData?.success && (
                <Banner title="Welcome" tone="info">
                  Please enter your Zenloop Organization ID and Survey ID to get started
                </Banner>
              )}
              
              {(loaderData?.error || actionData?.error) && (
                <Banner title="Error" tone="critical">
                  {loaderData?.error || actionData?.error}
                </Banner>
              )}
              
              {actionData?.success && (
                <Banner title="Success" tone="success">
                  Settings saved successfully
                </Banner>
              )}

              <Form method="post" onSubmit={handleSubmit}>
                <BlockStack gap="400">
                  <TextField
                    label="Organization ID"
                    name="orgId"
                    type="text"
                    autoComplete="off"
                    value={orgId}
                    onChange={handleOrgIdChange}
                    error={orgIdError}
                    helpText="Enter numbers only"
                    required
                  />
                  
                  <TextField
                    label="Survey ID"
                    name="surveyId"
                    type="text"
                    autoComplete="off"
                    value={surveyId}
                    onChange={handleSurveyIdChange}
                    error={surveyIdError}
                    helpText="Enter numbers only"
                    required
                  />
                </BlockStack>

                <Box paddingBlockStart="400">
                  <PageActions
                    primaryAction={{
                      content: "Save",
                      loading: isLoading,
                      submit: true,
                      disabled: !!orgIdError || !!surveyIdError,
                    }}
                  />
                </Box>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 