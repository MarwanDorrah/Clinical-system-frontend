'use client';

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  showStrength?: boolean;
  placeholder?: string;
}

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  required = false,
  showStrength = true,
  placeholder,
}: PasswordInputProps) {
  const getPasswordStrength = (password: string): {
    score: number;
    label: string;
    color: string;
    requirements: Array<{ met: boolean; text: string }>;
  } => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' },
      { met: /[^A-Za-z0-9]/.test(password), text: 'One special character' },
    ];

    const score = requirements.filter((r) => r.met).length;

    let label = 'Weak';
    let color = 'red';

    if (score >= 5) {
      label = 'Very Strong';
      color = 'green';
    } else if (score >= 4) {
      label = 'Strong';
      color = 'green';
    } else if (score >= 3) {
      label = 'Medium';
      color = 'yellow';
    } else if (score >= 2) {
      label = 'Fair';
      color = 'orange';
    }

    return { score, label, color, requirements };
  };

  const strength = value ? getPasswordStrength(value) : null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      
      {showStrength && value && strength && (
        <div className="mt-2">
          {/* Strength Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${strength.color}-500 transition-all duration-300`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
            />
          </div>
          
          {/* Strength Label */}
          <p className={`text-xs text-${strength.color}-600 font-medium mt-1`}>
            Password Strength: {strength.label}
          </p>
          
          {/* Requirements Checklist */}
          <div className="mt-2 space-y-1">
            {strength.requirements.map((req, index) => (
              <div key={index} className="flex items-center text-xs">
                {req.met ? (
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                )}
                <span className={req.met ? 'text-gray-700' : 'text-gray-500'}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
