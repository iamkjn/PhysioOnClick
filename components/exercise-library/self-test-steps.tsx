// The numbered "how to do it" list for a self-check test: each step is a photo
// (or its labelled placeholder) beside a heading + instruction bullets, stacking
// to a single column on narrow screens via pure CSS. Server component.

import { SelfTestImage } from "@/components/exercise-library/self-test-image";
import type { SelfTestStep } from "@/lib/exercise-library";

export function SelfTestSteps({
  steps,
  testName,
}: {
  steps: SelfTestStep[];
  testName: string;
}) {
  return (
    <ol className="exlib-selftest-steps" aria-label={`How to do the ${testName}`}>
      {steps.map((step, index) => (
        <li className="exlib-selftest-step" key={step.imageId}>
          <div className="exlib-selftest-step__media">
            <SelfTestImage
              imageId={step.imageId}
              label={step.label}
              stepNumber={index + 1}
            />
          </div>
          <div className="exlib-selftest-step__body">
            <p className="exlib-selftest-step__num">Step {index + 1}</p>
            <h3 className="exlib-selftest-step__label">{step.label}</h3>
            <ul className="exlib-selftest-step__points">
              {step.instruction.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
