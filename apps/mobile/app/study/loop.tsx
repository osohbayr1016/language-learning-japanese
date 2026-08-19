import React from "react";
import { useLocalSearchParams } from "expo-router";
import { LearningLoopScreen } from "../../src/features/study/learning-loop/LearningLoopScreen";

export default function LoopRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();
  
  return <LearningLoopScreen category={category || ""} />;
}
