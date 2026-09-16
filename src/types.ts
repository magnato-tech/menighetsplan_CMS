// Exact Domain Models requested for Menighetsplan

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  globalRole: "member" | "admin";
}

export type GroupCategory = "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe";

export interface MeetingSchedule {
  weekday: string;
  time: string;
  frequency: "hver uke" | "annenhver uke" | "hver måned";
}

export interface Group {
  id: string;
  name: string;
  category?: GroupCategory;
  memberIds: string[];
  leaderIds: string[];
  deputyLeaderIds?: string[];
  meetingSchedule?: MeetingSchedule;
  memberJoinedAt?: Record<string, string>; // ISO date when person joined group
  notificationPreferences?: Record<string, boolean>; // personId -> true/false
}

export interface ProgramItem {
  id?: string;
  time: string;
  title: string;
  description?: string;
  taskId?: string;
  groupId?: string;
}

export interface Gathering {
  id: string;
  groupId: string;
  title: string;
  startsAt: string; // ISO date
  location?: string;
  type?: "arrangement" | "gruppesamling";
  theme?: string;
  bibleText?: string;
  hostPersonId?: string;
  invitationSent?: boolean;
  invitationSentAt?: string;
  programSchedule?: ProgramItem[];
}

export interface GatheringAttendance {
  id: string;
  gatheringId: string;
  personId: string;
  status: "attending" | "declined"; // "attending" = KOMMER, "declined" = KOMMER IKKE
  updatedAt?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderPersonId: string;
  senderName: string;
  content: string;
  imageUrl?: string; // Optional attached photo
  createdAt: string; // ISO date
}

export interface Task {
  id: string;
  gatheringId: string;
  groupId: string;
  title: string;
  description?: string;
  instruction?: string;
  status: "open" | "assigned" | "confirmed" | "vacant" | "cancelled";
  neededCount?: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  personId: string;
  response: "pending" | "confirmed" | "declined" | "withdrawn";
}

// Presentation Model for reusable ActionCard component
export type BadgeVariant = "neutral" | "success" | "warning" | "urgent" | "info";

export interface ActionCardModel {
  id: string;
  taskId: string;
  title: string;
  gatheringTitle: string;
  dateTimeFormatted: string;
  groupName: string;
  location?: string;
  status: Task["status"];
  statusLabel: string;
  badgeVariant: BadgeVariant;
  primaryActionLabel?: string;
  primaryActionType?: "claim" | "absence" | "view";
  detailUrl: string;
  isAssignedToMe: boolean;
  assignedPersonName?: string;
}

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  permissionDenied?: boolean;
}

// -------------------------------------------------------------
// CMS Web Navigation Types (Pilot 1)
// -------------------------------------------------------------
export type WebNavigationType = "page" | "gathering" | "article" | "external" | "header";

export interface WebNavigationItem {
  id: string;
  label: string;
  parentId?: string | null;
  order: number;
  type: WebNavigationType;
  target?: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebNavigationTreeItem extends WebNavigationItem {
  children: WebNavigationItem[];
}

// -------------------------------------------------------------
// CMS Web Pages & Content Blocks (Pilot 2)
// -------------------------------------------------------------
export type WebPageStatus = "draft" | "published" | "archived";

export type ContentBlockType = "heading" | "text" | "image" | "button" | "quote" | "gathering";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  // Heading properties
  headingText?: string;
  headingLevel?: "h2" | "h3";
  // Text properties (both text and textContent supported for compatibility)
  text?: string;
  textContent?: string;
  // Image properties
  imageUrl?: string;
  imageCaption?: string;
  imageAlt?: string;
  // Button / CTA properties
  buttonLabel?: string;
  buttonUrl?: string;
  buttonStyle?: "primary" | "secondary" | "outline";
  buttonVariant?: "primary" | "secondary" | "outline";
  // Quote properties
  quoteText?: string;
  quoteAuthor?: string;
  // Gathering reference properties (Pilot 7 & Masterplan)
  gatheringId?: string;
  gatheringTitle?: string;
}

export interface WebPage {
  id: string;
  title: string;
  slug: string;
  ingress?: string;
  bodyText?: string;
  imageUrl?: string;
  status: WebPageStatus;
  blocks?: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

