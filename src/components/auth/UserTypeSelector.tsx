
import React from 'react';
import { User, UserCheck, Shield } from 'lucide-react';

interface UserTypeSelectorProps {
  selectedType: 'citizen' | 'contractor' | 'government';
  onTypeChange: (type: 'citizen' | 'contractor' | 'government') => void;
  disabled?: boolean;
}

const userTypes = [
  { 
    value: 'citizen' as const, 
    label: 'Citizen/Verifier', 
    icon: User, 
    description: 'Report problems, verify projects',
    gradient: 'from-slate-500 to-slate-600'
  },
  { 
    value: 'contractor' as const, 
    label: 'Contractor', 
    icon: UserCheck, 
    description: 'Bid on projects, deliver services',
    gradient: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'government' as const, 
    label: 'Government Official', 
    icon: Shield, 
    description: 'Approve projects, manage funds',
    gradient: 'from-indigo-600 to-indigo-700'
  }
];

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">User Type *</label>
      <div className="space-y-2">
        {userTypes.map(type => {
          const IconComponent = type.icon;
          return (
            <div
              key={type.value}
              className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedType === type.value
                  ? 'border-blue-500 bg-gradient-to-r from-slate-50 to-blue-50 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onTypeChange(type.value)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${type.gradient} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{type.label}</div>
                  <div className="text-sm text-slate-600">{type.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserTypeSelector;
