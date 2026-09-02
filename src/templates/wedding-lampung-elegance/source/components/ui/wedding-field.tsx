import type { ReactNode } from "react";

type WeddingFieldProps = {
  children: ReactNode;
  icon: ReactNode;
  label: string;
  htmlFor?: string;
  wide?: boolean;
};

export function WeddingField({ children, icon, label, htmlFor, wide = false }: WeddingFieldProps) {
  const heading = (
    <>
      <span className="wedding-field-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </>
  );

  return (
    <div className={`wedding-field${wide ? " wedding-field-wide" : ""}`}>
      {htmlFor ? (
        <label className="wedding-field-label" htmlFor={htmlFor}>{heading}</label>
      ) : (
        <div className="wedding-field-label">{heading}</div>
      )}
      <div className="wedding-field-control">{children}</div>
    </div>
  );
}
