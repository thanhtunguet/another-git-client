import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  fieldClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  fieldClassName = '',
  className = '',
  ...props
}) => {
  const inputEl = <input className={`input ${className}`.trim()} {...props} />;
  if (label) {
    return (
      <div className={`field ${fieldClassName}`.trim()}>
        <label>{label}</label>
        {inputEl}
      </div>
    );
  }
  return inputEl;
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  fieldClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  fieldClassName = '',
  className = '',
  ...props
}) => {
  const textareaEl = <textarea className={`input ${className}`.trim()} {...props} />;
  if (label) {
    return (
      <div className={`field ${fieldClassName}`.trim()}>
        <label>{label}</label>
        {textareaEl}
      </div>
    );
  }
  return textareaEl;
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: string[];
  fieldClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options = [],
  children,
  fieldClassName = '',
  className = '',
  ...props
}) => {
  const selectEl = (
    <select className={`input ${className}`.trim()} {...props}>
      {children || options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );

  if (label) {
    return (
      <div className={`field ${fieldClassName}`.trim()}>
        <label>{label}</label>
        {selectEl}
      </div>
    );
  }
  return selectEl;
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className={`radio ${className}`.trim()}>
      <input type="checkbox" {...props} />
      <span className="dot" />
      {label}
    </label>
  );
};
