interface AutomationClauseProps {
  children: React.ReactNode;
  description: string;
  label: string;
  step: number;
}

/** Frames one causal clause in the vertical automation builder. */
export function AutomationClause({
  children,
  description,
  label,
  step,
}: AutomationClauseProps): React.JSX.Element {
  return (
    <section className="automation-clause" aria-labelledby={`clause-${step}`}>
      <div className="automation-clause-rail" aria-hidden="true">
        <span>{String(step).padStart(2, '0')}</span>
      </div>
      <div className="automation-clause-body">
        <div className="automation-clause-heading">
          <h3 id={`clause-${step}`}>{label}</h3>
          <p>{description}</p>
        </div>
        <div className="automation-clause-fields">{children}</div>
      </div>
    </section>
  );
}
