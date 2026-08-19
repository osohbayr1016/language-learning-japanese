import React from 'react';
import { Screen } from '../../primitives';
import { StudyHubHeader } from './StudyHubHeader';
import { StudyPathProgressCards } from './StudyPathProgressCards';
import { AiReadingBanner } from './AiReadingBanner';
import { StudyCasualWords } from './StudyCasualWords';

export default function StudyHubScreen() {
  return (
    <Screen scroll scrollBottomInset={70}>
      <StudyHubHeader />
      <StudyPathProgressCards />
      <AiReadingBanner />
      <StudyCasualWords />
    </Screen>
  );
}
