import React from 'react';
import classNames from 'classnames';

interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Switch = ({ id, checked, onCheckedChange, className }: SwitchProps) => {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={classNames(
        "relative inline-flex items-center h-6 rounded-full w-11",
        className,
        checked ? "bg-blue-600" : "bg-gray-200"
      )}
    >
      <span
        className={classNames(
          "inline-block w-4 h-4 transform bg-white rounded-full transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};