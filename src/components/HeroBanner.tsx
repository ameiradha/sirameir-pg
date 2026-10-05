import React from 'react';
import { Sparkles, Gamepad2, Play } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface HeroBannerProps {
  settings: WebsiteSettings;
  onTitleClick: () => void;
  appsCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  onTitleClick,
  appsCount
}) => {
  return (
    <section className="bg-white border-b border-yellow-200 py-10 sm:py-14 text-center">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs font-bold uppercase tracking-wider mb-4">
          <Gamepad2 className="w-4 h-4 text-red-600" />
          <span>Pusat WebApp Interaktif</span>
        </div>

        {/* 5-Clickable Title */}
        <h1
          onClick={onTitleClick}
          className="text-3xl sm:text-5xl font-black text-red-600 uppercase font-mono tracking-tight mb-3 cursor-pointer hover:opacity-90 select-none transition-opacity"
          title="Klik 5 kali untuk akses Admin Portal"
        >
          {settings.siteName || 'SIR AMEIR PLAYGROUND'}
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-lg text-slate-700 font-medium max-w-xl mx-auto mb-2">
          "{settings.tagline || 'All my educational and interactive webapps in one place.'}"
        </p>

      </div>
    </section>
  );
};
