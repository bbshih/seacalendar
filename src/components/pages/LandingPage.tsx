import { useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ocean-50 to-ocean-100">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main title with gradient and animations */}
          <div className="mb-8 animate-slide-down">
            <h1
              className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🌊 SeaCalendar
            </h1>
            <div className="flex justify-center gap-4 text-4xl md:text-6xl animate-float">
              <span className="animate-bounce-slow">🌊</span>
              <span className="animate-wiggle">🐠</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.2s' }}>🌺</span>
              <span className="animate-wiggle" style={{ animationDelay: '0.3s' }}>⚓</span>
            </div>
          </div>

          {/* Subtitle with typing effect */}
          <p className="text-2xl md:text-3xl font-bold text-ocean-700 mb-4 animate-slide-up">
            Making friend hangouts
          </p>
          <p className="text-3xl md:text-4xl font-black mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-coral-500 via-ocean-500 to-coral-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              flow like the tide
            </span>
            <span className="inline-block animate-wave ml-2">🌊</span>
          </p>

          {/* Features cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card variant="glass" hover3d className="text-center">
              <div className="text-4xl mb-3 animate-bounce-slow">📅</div>
              <h3 className="font-bold text-ocean-700 text-lg mb-2">Pick Dates</h3>
              <p className="text-sm text-ocean-600">Suggest multiple options</p>
            </Card>
            <Card variant="glass" hover3d className="text-center">
              <div className="text-4xl mb-3 animate-wiggle">🗳️</div>
              <h3 className="font-bold text-ocean-700 text-lg mb-2">Vote Easy</h3>
              <p className="text-sm text-ocean-600">Everyone picks their faves</p>
            </Card>
            <Card variant="glass" hover3d className="text-center">
              <div className="text-4xl mb-3 animate-bounce-slow" style={{ animationDelay: '0.1s' }}>🎉</div>
              <h3 className="font-bold text-ocean-700 text-lg mb-2">Lock It In</h3>
              <p className="text-sm text-ocean-600">See results & decide</p>
            </Card>
          </div>

          {/* CTA Button with 3D hover effect */}
          <div
            className="animate-scale-in transform transition-all duration-300"
            style={{ animationDelay: '0.3s' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <a href="#/create">
              <Button
                variant="gradient"
                size="lg"
                className={`text-xl md:text-2xl px-12 py-6 ${isHovered ? 'animate-wiggle' : ''}`}
              >
                ⚓ Create Your Event
              </Button>
            </a>
          </div>

          {/* Fun tagline */}
          <p className="mt-8 text-ocean-600 text-sm md:text-base animate-fade-in" style={{ animationDelay: '0.4s' }}>
            No login. No ads. Just vibes. ✨
          </p>

          {/* My Events link */}
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <a
              href="#/my-events"
              className="text-ocean-600 hover:text-ocean-700 underline text-sm"
            >
              📋 View My Events
            </a>
          </div>
        </div>
      </div>
  );
}
