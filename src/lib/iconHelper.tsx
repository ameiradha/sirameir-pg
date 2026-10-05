import React from 'react';
import {
  Gamepad2,
  Brain,
  Atom,
  BookOpen,
  Wrench,
  Sparkles,
  Trophy,
  Award,
  FileCheck,
  RotateCw,
  Calculator,
  Globe,
  Heart,
  Rocket,
  Layers,
  Code,
  Bot,
  Shield,
  Clock,
  Compass,
  Zap,
  Target,
  FlaskConical,
  Lightbulb,
  Music,
  FolderKanban,
  Star,
  CheckCircle,
  Play
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Gamepad2,
  Brain,
  Atom,
  BookOpen,
  Wrench,
  Sparkles,
  Trophy,
  Award,
  FileCheck,
  RotateCw,
  Calculator,
  Globe,
  Heart,
  Rocket,
  Layers,
  Code,
  Bot,
  Shield,
  Clock,
  Compass,
  Zap,
  Target,
  FlaskConical,
  Lightbulb,
  Music,
  FolderKanban,
  Star,
  CheckCircle,
  Play
};

export const COLOR_VARIANTS: Record<string, { bg: string; text: string; ring: string }> = {
  red: {
    bg: 'bg-red-50 text-red-600',
    text: 'text-red-600',
    ring: 'border-red-200 shadow-sm'
  },
  yellow: {
    bg: 'bg-yellow-50 text-yellow-600',
    text: 'text-yellow-600',
    ring: 'border-yellow-300 shadow-sm'
  },
  amber: {
    bg: 'bg-amber-50 text-amber-600',
    text: 'text-amber-600',
    ring: 'border-amber-200 shadow-sm'
  },
  rose: {
    bg: 'bg-rose-50 text-rose-600',
    text: 'text-rose-600',
    ring: 'border-rose-200 shadow-sm'
  }
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface AppIconProps {
  name?: string;
  color?: string;
  iconType?: 'preset' | 'image' | 'emoji';
  iconUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppIcon: React.FC<AppIconProps> = ({
  name = 'Gamepad2',
  color = 'red',
  iconType = 'preset',
  iconUrl,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 p-2 rounded-xl text-sm',
    md: 'w-14 h-14 p-3 rounded-2xl text-xl',
    lg: 'w-20 h-20 p-4 rounded-3xl text-3xl',
    xl: 'w-24 h-24 p-5 rounded-3xl text-4xl'
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }[size];

  const colorStyle = COLOR_VARIANTS[color] || COLOR_VARIANTS.red;

  if (iconType === 'image' && iconUrl) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-sm ${sizeClasses} ${className}`}>
        <img src={iconUrl} alt="Logo" className="w-full h-full object-contain" />
      </div>
    );
  }

  const IconComponent = ICON_MAP[name] || Gamepad2;

  return (
    <div className={`relative flex items-center justify-center border transition-all ${colorStyle.bg} ${colorStyle.ring} ${sizeClasses} ${className}`}>
      <IconComponent className={`${iconSizes} ${colorStyle.text}`} />
    </div>
  );
};
