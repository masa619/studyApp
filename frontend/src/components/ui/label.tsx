import React, { ReactNode } from 'react';
import classNames from 'classnames';

interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export const Label = ({ htmlFor, children, className }: LabelProps) => {
  return (
    <label htmlFor={htmlFor} className={classNames("text-sm font-medium text-gray-700", className)}>
      {children}
    </label>
  );
};