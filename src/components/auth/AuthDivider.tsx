import React from 'react';

interface AuthDividerProps {
  text?: string;
}

const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'or' }) => {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-card px-4 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
};

export default AuthDivider;
