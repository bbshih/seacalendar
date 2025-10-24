export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-50 to-ocean-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-ocean-600 mb-4">
          🌊 SeaCalendar 🌊
        </h1>
        <p className="text-xl text-ocean-500 mb-8">
          Making friend hangouts flow like the tide 🐠
        </p>
        <a
          href="#/create"
          className="inline-block bg-ocean-500 hover:bg-ocean-600 font-semibold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          style={{ color: '#ffffff' }}
        >
          ⚓ Create Event
        </a>
      </div>
    </div>
  );
}
