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
    const zenloopSurveyUrl = "https://zensurveys-production.onrender.com"
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch aggregate data
        const aggregateResponse = await fetch(
          `${zenloopSurveyUrl}/api/v2/surveys/${settings.surveyId}/responses/aggregate`,
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

        // Fetch individual responses for each question separately
        if (aggregateData.surveyDefinition?.elements && aggregateData.surveyDefinition.elements.length > 0) {
          let allResponses = [];
          
          // Fetch responses for each question separately
          for (const question of aggregateData.surveyDefinition.elements) {
            console.log(`Fetching responses for question: ${question.name}`);
            
            let questionResponses = [];
            let page = 1;
            let hasMorePages = true;
            
            while (hasMorePages) {
              const responsesResponse = await fetch(
                `${zenloopSurveyUrl}/api/v2/surveys/${settings.surveyId}/public-responses?question_ids=${question.name}&page=${page}&page_size=100`,
                {
                  headers: {
                    'accept': 'application/json'
                  }
                }
              );

              if (!responsesResponse.ok) {
                throw new Error(`Failed to fetch responses for ${question.name}: ${responsesResponse.status}`);
              }

              const responsesData = await responsesResponse.json();
              console.log(`Page ${page} for ${question.name}:`, responsesData);
              
              if (responsesData.responses && responsesData.responses.length > 0) {
                questionResponses = [...questionResponses, ...responsesData.responses];
                page++;
                
                // Check if there are more pages
                if (responsesData.pagination && page > responsesData.pagination.total_pages) {
                  hasMorePages = false;
                }
              } else {
                hasMorePages = false;
              }
            }
            
            console.log(`Total responses for ${question.name}:`, questionResponses.length);
            allResponses = [...allResponses, ...questionResponses];
          }
          
          console.log("Total responses fetched:", allResponses.length);
          setResponses(allResponses);
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
    if (!aggregateData?.surveyDefinition?.elements) {
      return (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              No Survey Definition Found
            </Text>
            <Text variant="bodyMd">
              No survey definition found for the configured Organization ID and Survey ID. 
              Please verify your settings or check if your survey exists.
            </Text>
          </BlockStack>
        </Card>
      );
    }

    return aggregateData.surveyDefinition.elements.map((question, index) => {
      // Get responses for this specific question
      const questionResponses = responses.filter(response => 
        response.resultsData && response.resultsData[question.name]
      );

      const isCollapsed = collapsedQuestions.has(question.name);
      const hasResponses = questionResponses.length > 0;

      // Find aggregated data for this question if it exists
      const aggregatedQuestion = aggregateData.aggregatedData?.find(
        agg => agg.questionId === question.name
      );

      return (
        <Card key={index}>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingMd">
                {question.title}
              </Text>
              {hasResponses && (
                <Button
                  onClick={() => toggleQuestion(question.name)}
                  variant="plain"
                >
                  {isCollapsed ? "Show Responses" : "Hide Responses"}
                </Button>
              )}
            </InlineStack>
            
            {/* Show question type and details */}
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                Question Type: {question.type}
              </Text>
              {question.type === 'rating' && (
                <InlineStack gap="300">
                  <Text variant="bodyMd">
                    Rating Scale: {question.rateCount} points
                  </Text>
                  {question.minRateDescription && (
                    <Text variant="bodyMd">
                      Min: {question.minRateDescription}
                    </Text>
                  )}
                  {question.maxRateDescription && (
                    <Text variant="bodyMd">
                      Max: {question.maxRateDescription}
                    </Text>
                  )}
                </InlineStack>
              )}
              {question.isRequired && (
                <Badge tone="critical">Required</Badge>
              )}
            </BlockStack>
            
            {/* Show aggregated answers if available */}
            {aggregatedQuestion && aggregatedQuestion.answers?.values && (
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Response Summary:
                </Text>
                {Object.entries(aggregatedQuestion.answers.values).map(([choice, count]) => (
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
                    Individual Responses ({questionResponses.length}):
                  </Text>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text']}
                    headings={['Response ID', 'Date', 'Answer']}
                    rows={questionResponses.map((response) => {
                      const questionData = response.resultsData[question.name];
                      let answerText;
                      
                      if (question.type === 'comment') {
                        // For comment questions, show the written text
                        answerText = questionData;
                      } else if (question.type === 'rating') {
                        // For rating questions, show the score
                        answerText = `${questionData}/10`;
                      } else if (Array.isArray(questionData)) {
                        // For choice questions, show the choice text
                        answerText = questionData.join(', ');
                      } else {
                        answerText = questionData;
                      }
                      
                      return [
                        response.id,
                        formatDate(response.created),
                        answerText
                      ];
                    })}
                  />
                </BlockStack>
              </Collapsible>
            )}

            {!hasResponses && (
              <Text variant="bodyMd" tone="subdued">
                No responses yet for this question.
              </Text>
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