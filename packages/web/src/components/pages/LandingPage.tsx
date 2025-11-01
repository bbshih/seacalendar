import { useState, useEffect } from 'react';
import Card from '../shared/Card';

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 via-ocean-950 to-gray-950">
        {/* Grid overlay for digital feel */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Animated spotlight following cursor */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
            left: mousePos.x - 300,
            top: mousePos.y - 300,
            transition: 'all 0.3s ease-out',
          }}
        />

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 md:px-12 py-16 max-w-[1400px] mx-auto">

          {/* Hero section - digital cyber layout */}
          <div className="w-full mb-24">
            {/* Oversized title with digital glow */}
            <h1
              className="text-7xl md:text-[10rem] lg:text-[14rem] font-black leading-[0.85] mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-ocean-400 to-cyan-400 animate-pulse"
              style={{
                letterSpacing: '-0.05em',
                textShadow: '0 0 80px rgba(14, 165, 233, 0.5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SeaCalendar
            </h1>

            {/* Grid layout for content */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left - Tagline */}
              <div>
                <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-cyan-300 mb-8 leading-tight">
                  Friend hangouts that{' '}
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-lg border-2 border-coral-400 shadow-[0_0_20px_rgba(251,146,60,0.5)]">
                    flow
                  </span>
                  {' '}like the tide
                </p>

                {/* Digital emoji badges */}
                <div className="flex flex-wrap gap-4 mb-10">
                  {['🌊', '🐠', '🌺', '⚓'].map((emoji, i) => (
                    <span
                      key={i}
                      className="text-4xl bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-4 rounded-lg border-2 border-cyan-500/30 shadow-lg hover:scale-110 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all duration-300"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>

                {/* CTA - Digital button */}
                <a href="#/create">
                  <button
                    className="group relative text-2xl md:text-3xl font-black px-12 py-6 rounded-lg bg-gradient-to-r from-ocean-500 to-ocean-600 text-white overflow-hidden border-2 border-ocean-400 shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_50px_rgba(14,165,233,0.8)] transition-all duration-500 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Now
                      <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </a>

                {/* Digital tagline */}
                <p className="text-cyan-400 text-base font-mono mt-6 opacity-70 tracking-wider">
                  [ NO_LOGIN ] • [ NO_ADS ] • [ JUST_VIBES ]
                </p>
              </div>

              {/* Right - Digital feature card */}
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-lg p-8 shadow-2xl border-2 border-cyan-500/30 hover:border-cyan-400 transition-all duration-500 hover:shadow-[0_0_40px_rgba(14,165,233,0.3)]">
                <div className="space-y-6">
                  {/* Header with animated indicator */}
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-cyan-500/30">
                    <div className="text-5xl">📅</div>
                    <div>
                      <h3 className="text-2xl font-black text-cyan-300">System.Ready</h3>
                      <p className="text-cyan-400/70 font-mono text-sm">v2.0.0</p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-3 h-3 bg-seaweed-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                  </div>

                  {/* Features list with digital style */}
                  <div className="space-y-3 font-mono text-cyan-300">
                    {[
                      { label: 'date_options', status: 'ready' },
                      { label: 'realtime_voting', status: 'ready' },
                      { label: 'calendar_sync', status: 'ready' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="w-2 h-2 bg-seaweed-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="group-hover:text-cyan-200 transition-colors">
                          {item.label}()
                        </span>
                        <span className="ml-auto text-seaweed-500 text-xs">✓ {item.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal-style footer */}
                  <div className="pt-4 border-t-2 border-cyan-500/30 font-mono text-xs text-cyan-500/50">
                    &gt; Initializing hangout protocol...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features - digital panels */}
          <div className="w-full">
            <h2 className="text-4xl md:text-6xl font-black text-cyan-300 mb-4">
              <span className="font-mono text-cyan-500 text-2xl block mb-2">&lt;Protocol&gt;</span>
              How it works
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-transparent mb-12" />

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature cards with digital cyber styling */}
              {[
                {
                  emoji: '📅',
                  title: 'Pick Dates',
                  desc: 'Suggest multiple options for your hangout',
                  gradient: 'from-ocean-500 to-cyan-600',
                  color: 'cyan',
                  code: 'initiate_dates()'
                },
                {
                  emoji: '🗳️',
                  title: 'Vote Easy',
                  desc: 'Everyone picks their favorite dates',
                  gradient: 'from-coral-500 to-orange-600',
                  color: 'coral',
                  code: 'process_votes()'
                },
                {
                  emoji: '🎉',
                  title: 'Lock It In',
                  desc: 'See results and finalize your plans',
                  gradient: 'from-seaweed-500 to-green-600',
                  color: 'seaweed',
                  code: 'finalize_event()'
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative"
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Glowing neon effect on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-lg blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                    style={{
                      transform: hoveredCard === idx ? 'scale(1.05)' : 'scale(0.95)',
                      transition: 'all 0.5s ease-out',
                    }}
                  />

                  {/* Card panel */}
                  <div
                    className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-2 border-cyan-500/30 rounded-lg p-8 shadow-2xl overflow-hidden group-hover:border-cyan-400 transition-all duration-300"
                    style={{
                      transform: hoveredCard === idx ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: hoveredCard === idx ? '0 0 40px rgba(14, 165, 233, 0.3)' : '0 10px 30px rgba(0,0,0,0.3)',
                      transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {/* Corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-500/50" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-500/50" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-500/50" />

                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-cyan-500 text-sm">STEP_{idx + 1}</span>
                      <div className={`w-2 h-2 rounded-full bg-${feature.color}-500 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.6)]`} />
                    </div>

                    {/* Emoji with digital frame */}
                    <div className="relative w-20 h-20 mb-6 mx-auto">
                      <div
                        className="text-6xl flex items-center justify-center filter drop-shadow-lg"
                        style={{
                          transform: hoveredCard === idx ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.3s ease-out',
                        }}
                      >
                        {feature.emoji}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-black text-cyan-300 mb-3 text-center">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-cyan-400/80 leading-relaxed mb-6 text-center">
                      {feature.desc}
                    </p>

                    {/* Code snippet footer */}
                    <div className="pt-4 border-t border-cyan-500/20">
                      <code className="font-mono text-xs text-cyan-500/70 block text-center">
                        &gt; {feature.code}
                      </code>
                    </div>

                    {/* Hover scan line effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        transform: hoveredCard === idx ? 'translateY(100%)' : 'translateY(-100%)',
                        transition: 'transform 1s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Events link - digital style */}
          <div className="mt-20 text-center">
            <a
              href="#/my-events"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg border-2 border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:border-cyan-400 text-lg font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] group"
            >
              <span className="font-mono">[ VIEW_MY_EVENTS ]</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>
  );
}
