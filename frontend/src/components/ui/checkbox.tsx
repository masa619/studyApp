import React from 'react';
import classNames from 'classnames';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = ({ id, checked, onCheckedChange, className }: CheckboxProps) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={classNames("w-5 h-5 border-gray-300 rounded", className)}
    />
  );
};