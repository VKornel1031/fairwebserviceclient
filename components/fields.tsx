"use client";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
export function Field({
  label,
  hint,
  wide,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  wide?: boolean;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`field ${wide ? "field-wide" : ""}`}>
      <label htmlFor={inputId} className="field-label">
        {label}
        {props.required && <small aria-hidden="true"> *</small>}
      </label>
      <input
        {...props}
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
      />
      {hint && (
        <small id={`${inputId}-hint`} className="field-hint">
          {hint}
        </small>
      )}
    </div>
  );
}
export function Empty({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
