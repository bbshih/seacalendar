import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import CreateEventPage from './components/pages/CreateEventPage';
import VotingPage from './components/pages/VotingPage';
import ResultsPage from './components/pages/ResultsPage';
import VenueSelectionPage from './components/pages/VenueSelectionPage';
import EventSummaryPage from './components/pages/EventSummaryPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateEventPage />} />
        <Route path="/vote" element={<VotingPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/venue" element={<VenueSelectionPage />} />
        <Route path="/event" element={<EventSummaryPage />} />
      </Routes>
    </HashRouter>
  );
}
