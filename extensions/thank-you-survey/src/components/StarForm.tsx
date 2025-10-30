import { Text, Pressable, InlineStack } from "@shopify/ui-extensions-react/checkout"
import { useState } from "react";

export const StarForm = ({ surveyUrl, rateCount }: { surveyUrl: string, rateCount: number }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <InlineStack spacing={"none"} blockAlignment={"baseline"} inlineAlignment={"center"}>
      {Array.from({ length: rateCount }, (_, i) => (
        <ScoreItem key={i} rating={(i + 1)} icon={hoverRating < i + 1 ? '☆' : '★'} surveyUrl={surveyUrl} onHover={setHoverRating} />
      ))}
    </InlineStack>
  )
}

function ScoreItem({ key, rating, icon, surveyUrl, onHover }: { key: number, icon: string, rating: number, surveyUrl: string, onHover: (rating: number) => void }) {
  return (
    <Pressable
      to={surveyUrl + `&satisfaction_level=${rating}`}
      padding={"tight"}
      onPointerEnter={() => onHover(rating)}
      onPointerLeave={() => onHover(0)}
    >
      <Text appearance={"decorative"} size={"extraLarge"}>{icon}</Text>
    </Pressable>
  )
}