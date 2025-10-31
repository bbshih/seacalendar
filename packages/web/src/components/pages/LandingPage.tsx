import { useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-y2k-gradient bg-noise relative overflow-hidden">
        {/* Holographic overlay for Y2K vibe */}
        <div className="absolute inset-0 bg-holographic pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Main title with glossy effect and Y2K styling */}
          <div className="mb-8 animate-slide-down">
            <div className="relative inline-block mb-6">
              <h1
                className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-b from-ocean-400 via-ocean-500 to-ocean-700 bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4))',
                }}
              >
                🌊 SeaCalendar
              </h1>
              {/* Glossy highlight effect on title */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" style={{ height: '40%' }} />
            </div>
            <div className="flex justify-center gap-4 text-4xl md:text-6xl animate-float drop-shadow-lg">
              <span className="animate-bounce-slow" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>🌊</span>
              <span className="animate-wiggle" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>🐠</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.2s', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>🌺</span>
              <span className="animate-wiggle" style={{ animationDelay: '0.3s', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>⚓</span>
            </div>
          </div>

          {/* Subtitle with glossy embossed effect */}
          <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md rounded-3xl shadow-plastic border-2 border-white/50 p-6 mb-8 animate-slide-up">
            <p className="text-2xl md:text-3xl font-bold text-ocean-800 mb-3"
               style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.2)' }}>
              Making friend hangouts
            </p>
            <p className="text-3xl md:text-4xl font-black"
               style={{
                 textShadow: '0 2px 4px rgba(0,0,0,0.3)',
               }}>
              <span className="bg-gradient-to-r from-coral-500 via-ocean-500 to-coral-500 bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                flow like the tide
              </span>
              <span className="inline-block animate-wave ml-2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌊</span>
            </p>
          </div>

          {/* Features cards with Y2K glossy styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card variant="plastic" hover3d className="text-center">
              <div className="text-5xl mb-4 animate-bounce-slow" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>📅</div>
              <h3 className="font-black text-ocean-800 text-xl mb-2"
                  style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
                Pick Dates
              </h3>
              <p className="text-base text-ocean-700 font-semibold">Suggest multiple options</p>
            </Card>
            <Card variant="glossy" hover3d className="text-center">
              <div className="text-5xl mb-4 animate-wiggle" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>🗳️</div>
              <h3 className="font-black text-ocean-800 text-xl mb-2"
                  style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
                Vote Easy
              </h3>
              <p className="text-base text-ocean-700 font-semibold">Everyone picks their faves</p>
            </Card>
            <Card variant="plastic" hover3d className="text-center">
              <div className="text-5xl mb-4 animate-bounce-slow" style={{ animationDelay: '0.1s', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>🎉</div>
              <h3 className="font-black text-ocean-800 text-xl mb-2"
                  style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
                Lock It In
              </h3>
              <p className="text-base text-ocean-700 font-semibold">See results & decide</p>
            </Card>
          </div>

          {/* CTA Button with Y2K glossy effect */}
          <div
            className="animate-scale-in transform transition-all duration-300"
            style={{ animationDelay: '0.3s' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <a href="#/create">
              <Button
                variant="glossy"
                size="lg"
                className={`text-2xl md:text-3xl px-16 py-6 ${isHovered ? 'animate-wiggle' : ''}`}
              >
                <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>⚓ Create Your Event</span>
              </Button>
            </a>
          </div>

          {/* Fun tagline with glossy badge */}
          <div className="mt-8 animate-fade-in inline-block" style={{ animationDelay: '0.4s' }}>
            <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md rounded-full px-6 py-3 shadow-plastic border-2 border-white/60">
              <p className="text-ocean-800 text-base md:text-lg font-bold"
                 style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
                No login. No ads. Just vibes. ✨
              </p>
            </div>
          </div>

          {/* My Events link with button styling */}
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <a href="#/my-events">
              <Button variant="chrome" size="sm" className="text-sm">
                📋 View My Events
              </Button>
            </a>
          </div>
        </div>
      </div>
  );
}
