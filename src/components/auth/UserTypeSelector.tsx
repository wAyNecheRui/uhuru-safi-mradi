
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
    description: 'Report problems, verify projects' 
  },
  { 
    value: 'contractor' as const, 
    label: 'Contractor', 
    icon: UserCheck, 
    description: 'Bid on projects, deliver services' 
  },
  { 
    value: 'government' as const, 
    label: 'Government Official', 
    icon: Shield, 
    description: 'Approve projects, manage funds' 
  }
];

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
      <div className="space-y-2">
        {userTypes.map(type => {
          const IconComponent = type.icon;
          return (
            <div
              key={type.value}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onTypeChange(type.value)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
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
