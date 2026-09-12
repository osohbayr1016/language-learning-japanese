import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { LearningLoopScreen } from "../../src/features/study/learning-loop/LearningLoopScreen";

export default function LoopRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();

  // Opened without a category (an old bookmark, a typed URL) the loop has
  // nothing to teach and used to render a blank page. Send the learner to the
  // study hub where every category is listed.
  if (!category) return <Redirect href="/(tabs)/study" />;

  return <LearningLoopScreen category={category} />;
}
