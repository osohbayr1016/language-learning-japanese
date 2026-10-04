import React from 'react';
import { Screen, SectionHeading } from '../../primitives';
import { StudyHubHeader } from './StudyHubHeader';
import { StudyHero } from './StudyHero';
import { JlptJourneyCard } from './JlptJourneyCard';
import { StudyPathProgressCards } from './StudyPathProgressCards';
import { StudyModeGrid } from './StudyModeGrid';
import { AiReadingBanner } from './AiReadingBanner';
import { StudyCasualWords } from './StudyCasualWords';
import { useLessonChapters } from '../lessons/useLessonChapters';

export default function StudyHubScreen() {
  const { chapters, loading, advanceGateOk } = useLessonChapters();

  return (
    <Screen scroll scrollBottomInset={70}>
      <StudyHubHeader />
      <StudyHero chapters={chapters} lessonsLoading={loading} />

      <SectionHeading
        title="Суралцах үндсэн зам"
        subtitle="Дарааллаар нь хичээлээ хийж JLPT түвшнээ ахиул"
      />
      <JlptJourneyCard chapters={chapters} loading={loading} advanceGateOk={advanceGateOk} />

      <SectionHeading
        title="Суурь чадвар"
        subtitle="Кана, ханз, тоглоомоор гол чадваруудаа бататга"
      />
      <StudyPathProgressCards />

      <StudyModeGrid />
      <AiReadingBanner />
      <StudyCasualWords />
    </Screen>
  );
}
