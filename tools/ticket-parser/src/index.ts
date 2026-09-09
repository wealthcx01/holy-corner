/**
 * holy-corner-ticket-parser (HC-001) - public API. Ported from fountainbridge's FB-004.
 *
 * Pure, dependency-free parsing of `docs/tickets/*.md` into the bcap-contracts `Ticket` contract.
 * It turns markdown content plus caller context into a `Ticket` and its warnings. Nothing else:
 * no file fetching, no network, no inference about pull requests.
 *
 * Fountainbridge planned two follow-ons here (fetching tickets over the GitHub API, and deriving
 * status from an open pull request). NEITHER IS PLANNED IN THIS REPOSITORY. Holy Corner reads its
 * own tickets off the working tree, and its studio connectors read the two studios through their
 * own APIs (HC-031, HC-032) rather than through this tool.
 */

export { parseTicket, looksLikeTicket, mapStatus, parseDependsOn } from './parse';
export type {
  Ticket,
  TicketStatus,
  ParseContext,
  ParseResult,
  ParseWarning,
  ParseWarningCode,
} from './types';
export { TICKET_STATUSES } from './types';
