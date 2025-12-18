import { useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../../shopify.server";

// Loader - Fetch existing metafield settings
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Query to get the shop's metafield
  const response = await admin.graphql(
    `#graphql
      query getShopMetafield($namespace: String!, $key: String!) {
        shop {
          id
          metafield(namespace: $namespace, key: $key) {
            id
            value
          }
        }
      }`,
    {
      variables: {
        namespace: "zenloop",
        key: "settings",
      },
    }
  );

  const data = await response.json();
  const shop = data.data?.shop;
  const metafield = shop?.metafield;

  // Parse existing settings if metafield exists
  let existingSettings = null;
  if (metafield?.value) {
    try {
      existingSettings = JSON.parse(metafield.value);
    } catch (e) {
      console.error("Failed to parse metafield value:", e);
    }
  }

  return json({
    shopId: shop?.id,
    settings: existingSettings,
  });
};

// Action - Save form data to metafield
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();

  const orgId = formData.get("orgId");
  const surveyId = formData.get("surveyId");
  const displayType = formData.get("displayType");

  // Validate required fields
  if (!orgId || !surveyId || !displayType) {
    return json(
      {
        success: false,
        error: "All fields are required",
      },
      { status: 400 }
    );
  }

  // Prepare settings object
  const settings = {
    orgId: orgId,
    surveyId: surveyId,
    displayType,
  };

  // Validate numbers
  if (isNaN(Number(settings.orgId)) || isNaN(Number(settings.surveyId))) {
    return json(
      {
        success: false,
        error: "Organization ID and Survey ID must be valid numbers",
      },
      { status: 400 }
    );
  }

  try {
    // First, query the shop to get its ID
    const shopResponse = await admin.graphql(
      `#graphql
        query getShopId {
          shop {
            id
          }
        }`
    );

    const shopData = await shopResponse.json();
    const shopId = shopData.data?.shop?.id;

    if (!shopId) {
      throw new Error("Could not retrieve shop ID");
    }

    // Create or update the metafield
    const response = await admin.graphql(
      `#graphql
        mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
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
          metafields: [
            {
              namespace: "zenloop",
              key: "settings",
              type: "json",
              value: JSON.stringify(settings),
              ownerId: shopId,
            },
          ],
        },
      }
    );

    const result = await response.json();
    const userErrors = result.data?.metafieldsSet?.userErrors;

    if (userErrors && userErrors.length > 0) {
      return json(
        {
          success: false,
          error: userErrors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    return json({
      success: true,
      message: "Settings saved successfully!",
    });
  } catch (error) {
    console.error("Error saving metafield:", error);
    return json(
      {
        success: false,
        error: "Failed to save settings. Please try again.",
      },
      { status: 500 }
    );
  }
};

// Component
export default function Index() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  // Form state - initialize with existing settings or defaults
  const defaultValues = {
    orgId: settings?.orgId || "",
    surveyId: settings?.surveyId || "",
    displayType: settings?.displayType || "link",
  };

  const [formState, setFormState] = useState(defaultValues);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("orgId", formState.orgId);
    formData.append("surveyId", formState.surveyId);
    formData.append("displayType", formState.displayType);

    submit(formData, { method: "post" });
  };

  const displayTypeOptions = [
    { label: "Link to Survey", value: "link" },
    { label: "Embedded Form", value: "form" },
  ];

  return (
    <Page
      title="Zenloop Survey Settings"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
      }}
    >
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner tone="success">
              {actionData.message}
            </Banner>
          </Layout.Section>
        )}

        {actionData?.error && (
          <Layout.Section>
            <Banner tone="critical">
              {actionData.error}
            </Banner>
          </Layout.Section>
        )}

        {!settings && !actionData && (
          <Layout.Section>
            <Banner title="Welcome" tone="info">
              Please enter your Zenloop Organization ID and Survey ID to get started
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <FormLayout>
              <TextField
                label="Organization ID"
                type="number"
                value={formState.orgId}
                onChange={(value) =>
                  setFormState({ ...formState, orgId: value })
                }
                helpText="Enter your Zenloop organization ID"
                autoComplete="off"
              />

              <TextField
                label="Survey ID"
                type="number"
                value={formState.surveyId}
                onChange={(value) =>
                  setFormState({ ...formState, surveyId: value })
                }
                helpText="Enter your Zenloop survey ID"
                autoComplete="off"
              />

              <Select
                label="Display Type"
                options={displayTypeOptions}
                value={formState.displayType}
                onChange={(value) =>
                  setFormState({ ...formState, displayType: value })
                }
                helpText="Choose how to display the survey"
              />
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
