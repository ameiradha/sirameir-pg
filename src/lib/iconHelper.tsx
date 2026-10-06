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
  black: {
    bg: 'bg-black text-white',
    text: 'text-white',
    ring: 'border-black shadow-sm'
  },
  neutral: {
    bg: 'bg-neutral-100 text-neutral-900',
    text: 'text-neutral-900',
    ring: 'border-neutral-300 shadow-sm'
  },
  dark: {
    bg: 'bg-neutral-900 text-white',
    text: 'text-white',
    ring: 'border-neutral-800 shadow-sm'
  },
  white: {
    bg: 'bg-white text-black',
    text: 'text-black',
    ring: 'border-neutral-300 shadow-sm'
  },
  // Backward compatibility with previous color keys
  red: {
    bg: 'bg-black text-white',
    text: 'text-white',
    ring: 'border-black shadow-sm'
  },
  yellow: {
    bg: 'bg-neutral-100 text-neutral-900',
    text: 'text-neutral-900',
    ring: 'border-neutral-300 shadow-sm'
  },
  amber: {
    bg: 'bg-neutral-900 text-white',
    text: 'text-white',
    ring: 'border-black shadow-sm'
  },
  rose: {
    bg: 'bg-neutral-100 text-neutral-900',
    text: 'text-neutral-900',
    ring: 'border-neutral-300 shadow-sm'
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
  color = 'black',
  iconType = 'preset',
  iconUrl,
  className = '',
  size = 'md'
}) => {
  const containerDimensions = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-24 h-24 rounded-2xl',
    xl: 'w-28 h-28 rounded-3xl'
  }[size];

  const presetPaddingAndFont = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-xl',
    lg: 'p-4 text-3xl',
    xl: 'p-5 text-4xl'
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  }[size];

  const colorStyle = COLOR_VARIANTS[color] || COLOR_VARIANTS.black;

  // Custom uploaded image logo: Full-bleed square, fits completely inside
  if (iconType === 'image' && iconUrl) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center bg-white border border-neutral-300 shadow-sm ${containerDimensions} ${className}`}>
        <img
          src={iconUrl}
          alt="Logo WebApp"
          className="w-full h-full object-cover rounded-[inherit] block select-none"
        />
      </div>
    );
  }

  const IconComponent = ICON_MAP[name] || Gamepad2;

  return (
    <div className={`relative flex items-center justify-center border transition-all ${colorStyle.bg} ${colorStyle.ring} ${containerDimensions} ${presetPaddingAndFont} ${className}`}>
      <IconComponent className={`${iconSizes} ${colorStyle.text}`} />
    </div>
  );
};
