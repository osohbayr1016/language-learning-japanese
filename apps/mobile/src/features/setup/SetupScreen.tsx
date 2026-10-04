import React from 'react';
import { SetupLayout } from './SetupLayout';
import { LevelStep } from './LevelStep';
import { ReasonStep } from './ReasonStep';
import { NameStep } from './NameStep';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';
import { SuccessStep } from './SuccessStep';
import { CreatingModal } from './CreatingModal';
import { useSetupFlow } from './useSetupFlow';
import { TOTAL_STEPS } from './types';
import { mn } from '../../i18n/mn';

export default function SetupScreen() {
  const f = useSetupFlow();

  if (f.step === 5) {
    return (
      <SetupLayout
        current={TOTAL_STEPS}
        total={TOTAL_STEPS}
        onBack={() => { /* no-op */ }}
        ctaLabel={mn.setup.successCta}
        onCta={f.next}
        showCounter={false}
      >
        <SuccessStep />
      </SetupLayout>
    );
  }

  const ctaLabel = f.step === 4 ? mn.common.save : mn.common.continue;

  return (
    <>
      <SetupLayout
        current={f.step + 1}
        total={TOTAL_STEPS}
        onBack={f.goBack}
        ctaLabel={ctaLabel}
        onCta={f.next}
        ctaDisabled={!f.canProceed || f.submitting}
        ctaLoading={f.submitting}
      >
        {f.step === 0 ? (
          <LevelStep
            value={f.answers.level}
            placementLevel={f.answers.placementLevel}
            onChange={(v) => {
              f.update('level', v);
              f.update('placementLevel', null);
            }}
            onPlacementComplete={(v) => f.update('placementLevel', v)}
          />
        ) : null}
        {f.step === 1 ? (
          <ReasonStep value={f.answers.reason} onChange={(v) => f.update('reason', v)} />
        ) : null}
        {f.step === 2 ? (
          <NameStep value={f.answers.name} onChange={(v) => f.update('name', v)} />
        ) : null}
        {f.step === 3 ? (
          <EmailStep
            name={f.answers.name}
            value={f.answers.email}
            onChange={(v) => f.update('email', v)}
            error={f.error === 'invalid_email' ? mn.setup.invalidEmail : f.error}
          />
        ) : null}
        {f.step === 4 ? (
          <PasswordStep
            password={f.answers.password}
            confirm={f.confirm}
            onChangePassword={(v) => f.update('password', v)}
            onChangeConfirm={f.setConfirm}
            error={
              f.error === 'mismatch' ? mn.setup.passwordMismatch
              : f.error === 'weak' ? mn.auth.weakPassword
              : f.error
            }
          />
        ) : null}
      </SetupLayout>
      <CreatingModal visible={f.submitting} />
    </>
  );
}
