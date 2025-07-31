import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  DataTable,
  Badge,
  Spinner,
  Banner,
  Box,
  InlineStack,
  Button,
  Collapsible,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Get shop settings
    const data = await admin.graphql(`
      {
        shop {
          metafield(namespace: "zenloop", key: "settings") {
            value
          }
        }
      }
    `);

    const response = await data.json();
    const metafieldValue = response?.data?.shop?.metafield?.value;

    if (!metafieldValue) {
      return json({ 
        error: "Please configure your Zenloop settings first",
        settings: null 
      });
    }

    let settings;
    try {
      settings = JSON.parse(metafieldValue);
    } catch (error) {
      return json({ 
        error: "Invalid settings format",
        settings: null 
      });
    }

    if (!settings.orgId || !settings.surveyId) {
      return json({ 
        error: "Organization ID and Survey ID are required",
        settings: null 
      });
    }

    return json({ settings });
  } catch (error) {
    return json({ 
      error: "Authentication failed. Please refresh the page.",
      settings: null 
    }, { status: 401 });
  }
};

function FeedbackDisplay({ settings }) {
  const [aggregateData, setAggregateData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedQuestions, setCollapsedQuestions] = useState(new Set());

  const toggleQuestion = (questionId) => {
    setCollapsedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch aggregate data
        const aggregateResponse = await fetch(
          `https://surveys-backend-1mxy.onrender.com/api/v2/surveys/${settings.surveyId}/responses/aggregate`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        );

        if (!aggregateResponse.ok) {
          throw new Error(`Failed to fetch aggregate data: ${aggregateResponse.status}`);
        }

        const aggregateData = await aggregateResponse.json();
        setAggregateData(aggregateData);

        // Fetch individual responses for the first question
        if (aggregateData.aggregatedData && aggregateData.aggregatedData.length > 0) {
          const firstQuestionId = aggregateData.aggregatedData[0].questionId;
          
          const responsesResponse = await fetch(
            `https://surveys-backend-1mxy.onrender.com/api/v2/surveys/${settings.surveyId}/public-responses?question_ids=${firstQuestionId}&page=1&page_size=25`,
            {
              headers: {
                'accept': 'application/json'
              }
            }
          );

          if (!responsesResponse.ok) {
            throw new Error(`Failed to fetch responses: ${responsesResponse.status}`);
          }

          const responsesData = await responsesResponse.json();
          setResponses(responsesData.responses || []);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (settings) {
      fetchData();
    }
  }, [settings]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAggregateData = () => {
    if (!aggregateData?.aggregatedData) {
      return (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              No Survey Data Found
            </Text>
            <Text variant="bodyMd">
              No survey responses found for the configured Organization ID and Survey ID. 
              Please verify your settings or check if your survey has received any responses.
            </Text>
          </BlockStack>
        </Card>
      );
    }

    return aggregateData.aggregatedData.map((question, index) => {
      // Get responses for this specific question
      const questionResponses = responses.filter(response => 
        response.resultsData && response.resultsData[question.questionId]
      );

      const isCollapsed = collapsedQuestions.has(question.questionId);
      const hasResponses = questionResponses.length > 0;

      return (
        <Card key={index}>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingMd">
                {question.title}
              </Text>
              {hasResponses && (
                <Button
                  onClick={() => toggleQuestion(question.questionId)}
                  variant="plain"
                >
                  {isCollapsed ? "Show Responses" : "Hide Responses"}
                </Button>
              )}
            </InlineStack>
            
            {question.type === 'checkbox' && question.answers?.values && (
              <BlockStack gap="300">
                {Object.entries(question.answers.values).map(([choice, count]) => (
                  <InlineStack key={choice} align="space-between">
                    <Text variant="bodyMd">
                      {choice === 'other' ? 'Other' : choice}
                    </Text>
                    <Badge tone="info">{count} responses</Badge>
                  </InlineStack>
                ))}
              </BlockStack>
            )}

            {/* Show individual responses for this question */}
            {hasResponses && (
              <Collapsible open={!isCollapsed}>
                <BlockStack gap="300">
                  <Text as="h4" variant="headingSm">
                    Individual Responses:
                  </Text>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text']}
                    headings={['Response ID', 'Date', 'Answer']}
                    rows={questionResponses.map((response) => {
                      const questionData = response.resultsData[question.questionId];
                      return [
                        response.id,
                        formatDate(response.created),
                        Array.isArray(questionData) ? questionData.join(', ') : questionData
                      ];
                    })}
                  />
                </BlockStack>
              </Collapsible>
            )}
          </BlockStack>
        </Card>
      );
    });
  };

  const renderResponsesTable = () => {
    if (!responses.length) {
      return (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              No Individual Responses Found
            </Text>
            <Text variant="bodyMd">
              No individual survey responses found for the configured settings.
            </Text>
          </BlockStack>
        </Card>
      );
    }

    const rows = responses.map((response) => {
      const questionData = response.resultsData[Object.keys(response.resultsData)[0]];
      return [
        response.id,
        formatDate(response.created),
        Array.isArray(questionData) ? questionData.join(', ') : questionData
      ];
    });

    return (
      <DataTable
        columnContentTypes={['text', 'text', 'text']}
        headings={['Response ID', 'Date', 'Answer']}
        rows={rows}
      />
    );
  };

  if (loading) {
    return (
      <Box padding="400" display="flex" justifyContent="center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Banner title="Error" tone="critical">
        {error}
      </Banner>
    );
  }

  return (
    <Page
      title="Survey Feedback"
      subtitle={`Survey ID: ${settings.surveyId}`}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Survey Results
              </Text>
              {renderAggregateData()}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function Feedback() {
  const { settings, error } = useLoaderData();

  if (error) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner title="Error" tone="critical">
              {error}
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (!settings) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner title="Configuration Required" tone="warning">
              Please configure your Zenloop settings first.
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return <FeedbackDisplay settings={settings} />;
} 