import React, { InputHTMLAttributes, useState } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  label?: string;
  isPassword?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  icon, 
  label, 
  isPassword, 
  className,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text';

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </label>
      )}
      <div className={`input-glass rounded-lg flex items-center group ${className}`}>
        {icon && (
          <span className="pl-4 text-gray-500 material-symbols-outlined text-[20px] select-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          type={inputType}
          className="w-full bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 focus:outline-none text-sm py-3 px-3 h-12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-4 text-gray-600 hover:text-gray-400 transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px] select-none">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};