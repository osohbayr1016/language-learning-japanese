import React from 'react';
import { Screen, SectionHeading } from '../../primitives';
import { StudyHubHeader } from './StudyHubHeader';
import { StudyHero } from './StudyHero';
import { JlptJourneyCard } from './JlptJourneyCard';
import { StudyPathProgressCards } from './StudyPathProgressCards';
import { StudyModeGrid } from './StudyModeGrid';
import { AiReadingBanner } from './AiReadingBanner';
import { StudyCasualWords } from './StudyCasualWords';
import { StudyDataStatusCard } from './StudyDataStatusCard';
import { useStudyNextAction } from './useStudyNextAction';
import { useLessonChapters } from '../lessons/useLessonChapters';

export default function StudyHubScreen() {
  const {
    chapters,
    loading: lessonsLoading,
    advanceGateOk,
    error: lessonsError,
    degraded,
    retry: retryLessons,
  } = useLessonChapters();

  const {
    action,
    loading: actionLoading,
    error: actionError,
    retry: retryAction,
  } = useStudyNextAction(chapters);

  return (
    <Screen scroll scrollBottomInset={70}>
      <StudyHubHeader />

      {actionError ? (
        <StudyDataStatusCard
          kind="error"
          title="Хувийн төлөвлөгөөг ачаалж чадсангүй"
          message={actionError}
          onRetry={retryAction}
        />
      ) : (
        <StudyHero action={action} loading={actionLoading} />
      )}

      {lessonsError ? (
        <StudyDataStatusCard
          kind={degraded ? 'warning' : 'error'}
          title={degraded ? 'Явцын мэдээлэл түр алга' : 'Хичээлийн замыг ачаалж чадсангүй'}
          message={
            degraded
              ? 'Нийтийн хичээлүүдийг харуулж байна. Таны дуусгасан хичээл, unlock төлөв одоогоор баталгаажаагүй.'
              : lessonsError
          }
          onRetry={retryLessons}
        />
      ) : null}

      <SectionHeading
        title="Суралцах үндсэн зам"
        subtitle="Дарааллаар нь хичээлээ хийж JLPT түвшнээ ахиул"
      />
      <JlptJourneyCard
        chapters={chapters}
        loading={lessonsLoading}
        advanceGateOk={advanceGateOk}
        dataReliable={!degraded && !lessonsError}
      />

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
