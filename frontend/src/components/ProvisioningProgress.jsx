import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

const STEP_LABELS = [
  'Cloning template...',
  'Starting VM...',
  'Waiting for VM to become ready...',
  'Setting access credentials...',
  'Configuring network route...',
  'Your environment is ready!'
];

export default function ProvisioningProgress({ steps, status }) {
  return (
    <div className="space-y-3">
      {STEP_LABELS.map((label, i) => {
        const step = steps.find(s => s.step === label);
        const isActive = step && step.status === 'in_progress';
        const isDone = step && (step.status === 'ready' || steps.findIndex(s => s.step === label) < steps.length - 1);
        const isError = step && step.status === 'error';

        return (
          <div key={i} className="flex items-center gap-3">
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : isActive ? (
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin shrink-0" />
            ) : isError ? (
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0" />
            )}
            <span className={`text-sm ${isDone ? 'text-green-700' : isActive ? 'text-brand-700 font-medium' : isError ? 'text-red-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
