/**
 * @seacalendar/shared
 * Shared types, utilities, and validation for SeaCalendar
 */

// Export types
export * from "./types/index.js";

// Export utilities (client-safe only)
export * from "./utils/dateHelpers";

// Server-only utilities (not exported to avoid bundling heavy deps in web)
// Import directly from @seacalendar/shared/dist/utils/nlpDateParser if needed
// Import directly from @seacalendar/shared/dist/utils/llmDateParser if needed

// Export validation schemas (will add later with Zod)
// export * from './validation';
