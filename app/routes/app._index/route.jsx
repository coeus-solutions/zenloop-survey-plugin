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
import { validateSurveySettings } from "../../settingsValidation.server";
import { getShopId, getMetafield, setMetafield } from "../../shopify/adminApi.server";


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { shopId, value } = await getMetafield(admin, "zenloop", "settings");
  return json({ shopId, settings: value });
};

// Action - Save form data to metafield
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const validation = await validateSurveySettings(formData);

  if (validation.error) {
    return json({ error: validation.error }, { status: 400 });
  }

  const { settings } = validation;

  try {
    const shopId = await getShopId(admin);
    await setMetafield(admin, "zenloop", "settings", settings, shopId);

    return json({ message: "Settings saved successfully!" });
  } catch (error) {
    console.error("Error saving metafield:", error);
    const errorMessage = error.message || "Failed to save settings. Please try again."

    return json({ error: errorMessage }, { status: 500 });
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
        {actionData?.message && (
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
