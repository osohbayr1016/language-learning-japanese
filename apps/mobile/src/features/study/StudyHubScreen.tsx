import React, { useEffect, useState } from 'react';
import { Screen, SectionHeading } from '../../primitives';
import { StudyHubHeader } from './StudyHubHeader';
import { StudyHero } from './StudyHero';
import { JlptJourneyCard } from './JlptJourneyCard';
import { StudyPathProgressCards } from './StudyPathProgressCards';
import { StudyModeGrid } from './StudyModeGrid';
import { AiReadingBanner } from './AiReadingBanner';
import { StudyCasualWords } from './StudyCasualWords';
import { useLessonChapters } from '../lessons/useLessonChapters';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { StudyNextAction } from '../../lib/api/user';

export default function StudyHubScreen() {
  const { token } = useAuth();
  const { chapters, loading: lessonsLoading, advanceGateOk } = useLessonChapters();
  const [action, setAction] = useState<StudyNextAction | null>(null);
  const [actionLoading, setActionLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setAction(null);
      setActionLoading(false);
      return () => { alive = false; };
    }

    setActionLoading(true);
    void api.user.nextAction(token)
      .then((res) => { if (alive) setAction(res.data); })
      .catch(() => { if (alive) setAction(null); })
      .finally(() => { if (alive) setActionLoading(false); });

    return () => { alive = false; };
  }, [token, chapters]);

  return (
    <Screen scroll scrollBottomInset={70}>
      <StudyHubHeader />
      <StudyHero action={action} loading={actionLoading} />

      <SectionHeading
        title="Суралцах үндсэн зам"
        subtitle="Дарааллаар нь хичээлээ хийж JLPT түвшнээ ахиул"
      />
      <JlptJourneyCard chapters={chapters} loading={lessonsLoading} advanceGateOk={advanceGateOk} />

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
