export interface Event {
  id: string;
  title: string;
  organizer: string;
  dateOptions: DateOption[];
  votes: Vote[];
  finalizedEvent?: FinalizedEvent;
  createdAt: string;
}

export interface DateOption {
  id: string;
  date: string; // ISO date format: "2025-01-10"
  label: string; // Display format: "Fri Jan 10"
}

export interface Vote {
  voterName: string;
  selectedDates: string[]; // Array of DateOption ids
  timestamp: string;
}

export interface FinalizedEvent {
  selectedDateId: string;
  venue: VenueDetails;
  attendees: string[];
}

export interface VenueDetails {
  name: string;
  address: string;
  time: string; // "7:00 PM"
  websiteUrl?: string;
  menuUrl?: string;
  notes?: string;
}

export interface VoteTally {
  dateOption: DateOption;
  voteCount: number;
  voters: string[];
}
