import { useState } from "react";
import { v4 as uuidv4 } from "@lukeed/uuid";
import Card from "../shared/Card";
import Input from "../shared/Input";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import CopyButton from "../shared/CopyButton";
import GitHubTokenSetup from "../shared/GitHubTokenSetup";
import CalendarMonthView from "../features/CalendarMonthView";
import DatePatternPresets from "../features/DatePatternPresets";
import QuickAddBuilder from "../features/QuickAddBuilder";
import type { Event, DateOption } from "../../types";
import { formatDateLabel } from "../../utils/dateHelpers";
import {
  createEventGist,
  getGitHubToken,
  type CreateEventResult,
} from "../../utils/githubStorage";
import { saveMyEvent } from "../../utils/myEvents";

export default function CreateEventPage() {
  const [eventTitle, setEventTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  // Password protection
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  // Manual add state
  const [manualDate, setManualDate] = useState("");

  // Modal state
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [eventResult, setEventResult] = useState<CreateEventResult | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleManualAdd = () => {
    if (!manualDate) {
      alert("Please select a date");
      return;
    }

    // Check for duplicates
    if (dateOptions.some((opt) => opt.date === manualDate)) {
      alert("This date has already been added");
      return;
    }

    const newDateOption: DateOption = {
      id: `date-${dateOptions.length}`,
      date: manualDate,
      label: formatDateLabel(manualDate),
    };

    setDateOptions([...dateOptions, newDateOption]);
    setManualDate("");
  };

  const handleCalendarAddDate = (isoDate: string) => {
    // Check for duplicates
    if (dateOptions.some((opt) => opt.date === isoDate)) {
      return; // Silently ignore duplicates in calendar view
    }

    const newDateOption: DateOption = {
      id: `date-${Date.now()}-${Math.random()}`, // More unique ID for calendar
      date: isoDate,
      label: formatDateLabel(isoDate),
    };

    setDateOptions([...dateOptions, newDateOption]);
  };

  const handleRemoveDate = (id: string) => {
    setDateOptions(dateOptions.filter((opt) => opt.id !== id));
  };

  const handleGenerateLinks = async () => {
    if (!eventTitle.trim()) {
      alert("Please enter an event title");
      return;
    }

    if (!organizerName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (dateOptions.length === 0) {
      alert("Please add at least one date option");
      return;
    }

    if (usePassword && !password.trim()) {
      alert("Please enter a password or disable password protection");
      return;
    }

    if (usePassword && password.length < 8) {
      alert("Password must be at least 8 characters for security");
      return;
    }

    const token = githubToken || getGitHubToken();
    if (!token) {
      alert("Please set up your GitHub token first");
      return;
    }

    // Sort dates chronologically
    const sortedDates = [...dateOptions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const event: Event = {
      id: uuidv4(),
      title: eventTitle.trim(),
      organizer: organizerName.trim(),
      dateOptions: sortedDates,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    setIsCreating(true);
    setCreateError("");

    try {
      const result = await createEventGist(
        event,
        { token },
        usePassword ? password : undefined
      );
      setEventResult(result);
      setShowLinksModal(true);

      // Save event to My Events
      saveMyEvent({
        gistId: result.gistId,
        title: event.title,
        createdAt: event.createdAt,
        votingUrl: result.votingUrl,
        resultsUrl: result.resultsUrl,
      });
    } catch (error) {
      console.error("Failed to create event:", error);
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create event. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handlePatternDatesSelected = (dates: string[]) => {
    // Convert dates to DateOptions
    const newDateOptions: DateOption[] = dates.map((isoDate, index) => ({
      id: `date-${dateOptions.length + index}-${Date.now()}`,
      date: isoDate,
      label: formatDateLabel(isoDate),
    }));

    // Filter out duplicates and add new dates
    const existingDates = new Set(dateOptions.map((opt) => opt.date));
    const uniqueNewOptions = newDateOptions.filter(
      (opt) => !existingDates.has(opt.date)
    );

    setDateOptions([...dateOptions, ...uniqueNewOptions]);
  };

  return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-ocean-50 to-ocean-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              ⚓ Set Sail on a New Adventure ⛵
            </h1>
            <p className="text-lg text-ocean-700 font-semibold animate-slide-up">
              Create an event and let your crew vote on dates 🗳️
            </p>
          </div>

          {/* GitHub Token Setup */}
          <div className="mb-6">
          <GitHubTokenSetup
            onTokenReady={setGithubToken}
            requireToken={false}
          />
        </div>

        <Card hover3d={false}>
          {/* Event Details */}
          <div className="space-y-6">
            <Input
              label="Event Title"
              placeholder="Q1 2025 Hangouts"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              fullWidth
            />

            <Input
              label="Your Name (Organizer)"
              placeholder="Your name"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              fullWidth
            />

            {/* Password Protection */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="use-password"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 text-ocean-600 border-ocean-300 rounded focus:ring-ocean-500"
              />
              <label htmlFor="use-password" className="text-ocean-700">
                Password protect event
              </label>
            </div>

            {usePassword && (
              <Input
                label="Event Password"
                type="password"
                placeholder="Choose a memorable password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
            )}

            {/* Date Selection */}
            <div>
              <h2 className="text-2xl font-bold text-ocean-600 mb-4">
                📅 Add Date Options
              </h2>

              {/* Calendar View */}
              <div className="mb-6">
                <h3 className="font-semibold text-ocean-700 mb-3">
                  Calendar View: Click to Select Dates
                </h3>
                <CalendarMonthView
                  dateOptions={dateOptions}
                  onAddDate={handleCalendarAddDate}
                  onRemoveDate={handleRemoveDate}
                />
              </div>

              {/* Quick Presets */}
              <div className="mb-6">
                <DatePatternPresets onDatesSelected={handlePatternDatesSelected} />
              </div>

              {/* Quick Add Builder */}
              <div className="mb-6">
                <QuickAddBuilder onDatesSelected={handlePatternDatesSelected} />
              </div>

              <div className="bg-sand-100 p-6 rounded-xl mb-6">
                <h3 className="font-semibold text-ocean-700 mb-3">
                  Add Single Date
                </h3>
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    fullWidth
                  />
                  <Button onClick={handleManualAdd} variant="outline" size="md">
                    ➕ Add Date
                  </Button>
                </div>
              </div>

            </div>

            {/* Generate Button */}
            <div className="pt-6 border-t-2 border-ocean-100">
              {createError && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
                  {createError}
                </div>
              )}
              <Button
                onClick={handleGenerateLinks}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isCreating || !githubToken}
              >
                {isCreating
                  ? "🔄 Creating Poll..."
                  : "🚀 Create Poll"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Links Modal */}
        <Modal
          isOpen={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          title="🎉 Your Event is Ready!"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-seaweed-50 border-2 border-seaweed-200 rounded-lg p-4">
              <p className="text-seaweed-800 font-medium">
                ✅ Event stored securely in private encrypted Gist
              </p>
              <p className="text-sm text-seaweed-700 mt-1">
                Share the voting link with your friends. Keep the results link
                for yourself!
              </p>
            </div>

            {usePassword ? (
              <div className="bg-seaweed-50 border-2 border-seaweed-400 rounded-lg p-4">
                <p className="text-seaweed-800 font-semibold mb-2">
                  🔒 Password Protected
                </p>
                <p className="text-sm text-seaweed-700 mb-2">
                  Your event is password-protected! The URLs below don't contain
                  encryption keys.
                </p>
                <div className="bg-white rounded-lg p-3 mt-2">
                  <p className="text-sm font-semibold text-ocean-700 mb-1">
                    Event Password:
                  </p>
                  <code className="text-lg font-mono text-ocean-600 bg-ocean-50 px-3 py-1 rounded">
                    {password}
                  </code>
                </div>
                <p className="text-sm text-seaweed-600 mt-2">
                  Share this password with voters through a separate channel
                  (text message, Signal, in-person, etc.)
                </p>
              </div>
            ) : (
              <div className="bg-coral-50 border-2 border-coral-400 rounded-lg p-4">
                <p className="text-coral-800 font-semibold mb-2">
                  ⚠️ Security Notice
                </p>
                <ul className="text-sm text-coral-700 space-y-1">
                  <li>
                    • These URLs contain encryption keys - anyone with the URL
                    can view/vote
                  </li>
                  <li>
                    • Don't share URLs in public channels (avoid Discord, Slack,
                    public forums)
                  </li>
                  <li>
                    • URLs will be saved in browser history and may be logged by
                    analytics
                  </li>
                  <li>
                    • For sensitive events, consider using password protection
                    instead
                  </li>
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voting Link (Share with friends)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventResult?.votingUrl || ""}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
                />
                <CopyButton
                  textToCopy={eventResult?.votingUrl || ""}
                  variant="secondary"
                  size="md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Link (For organizer only)
              </label>
              <div className="flex gap-2">
                <a
                  href={eventResult?.resultsUrl || ""}
                  className="flex-1 px-4 py-2 border-2 border-coral-200 rounded-lg bg-sand-100 text-sm font-mono hover:bg-sand-200 transition-colors break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {eventResult?.resultsUrl || ""}
                </a>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => window.open(eventResult?.resultsUrl || "", '_blank')}
                >
                  View Results
                </Button>
              </div>
              <p className="mt-2 text-sm text-coral-500 font-medium">
                ⚠️ Important: Save this link to access results and finalize the
                event!
              </p>
            </div>

            <div className="bg-ocean-50 border-2 border-ocean-200 rounded-lg p-4">
              <h4 className="font-semibold text-ocean-800 mb-2">
                Privacy & Storage
              </h4>
              <ul className="text-sm text-ocean-700 space-y-1">
                <li>• Votes are encrypted before storage</li>
                <li>• Stored in a private GitHub Gist (not publicly listed)</li>
                <li>
                  • You can delete the event data anytime from the results page
                </li>
                <li>
                  • Gist ID:{" "}
                  <code className="bg-white px-1 rounded text-xs">
                    {eventResult?.gistId}
                  </code>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-ocean-200">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => window.location.hash = '/my-events'}
              >
                📋 View All My Events
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setShowLinksModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
  );
}
