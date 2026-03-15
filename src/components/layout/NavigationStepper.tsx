'use client';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';
import { TournamentPhase } from '@/types';

const steps = [
  { label: 'プレイヤー登録', phase: 'registration' },
  { label: 'ラウンド進行', phase: 'rounds' },
  { label: '最終結果', phase: 'finished' },
];

interface NavigationStepperProps {
  phase: TournamentPhase;
  currentRound?: number;
  totalRounds?: number;
}

export default function NavigationStepper({ phase, currentRound, totalRounds }: NavigationStepperProps) {
  const activeStep = steps.findIndex((s) => s.phase === phase);

  return (
    <Box sx={{ width: '100%', py: 2, px: 1 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step key={step.phase}>
            <StepLabel>
              {step.label}
              {step.phase === 'rounds' && currentRound && totalRounds
                ? ` (${currentRound}/${totalRounds})`
                : ''}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
