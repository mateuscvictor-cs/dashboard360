export * from './survey.types'

export type HealthStatus = "critical" | "risk" | "attention" | "healthy";
export type Priority = "critical" | "high" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "negative";
export type ConfidenceLevel = "high" | "medium" | "low";
export type InsightType = "recommendation" | "alert" | "opportunity" | "trend" | "warning";
export type InsightStatus = "active" | "read" | "actioned" | "dismissed" | "expired";
export type InsightScope = "company" | "cs_owner" | "portfolio" | "squad";

export interface Account {
  id: string;
  name: string;
  logo?: string;
  segment: string;
  plan: string;
  mrr: number;
  healthScore: number;
  healthStatus: HealthStatus;
  riskScore: number;
  expansionScore: number;
  adoptionScore: number;
  csOwner: string;
  squad: string;
  lastInteraction: string;
  nextDelivery?: string;
  tags: string[];
  contacts: Contact[];
  timeline: TimelineEvent[];
  deliveries: Delivery[];
  usageData: UsageDataPoint[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  isDecisionMaker: boolean;
  engagementLevel: "high" | "medium" | "low" | "inactive";
  lastContact: string;
  avatar?: string;
}

export interface TimelineEvent {
  id: string;
  type: "meeting" | "message" | "delivery" | "incident" | "milestone" | "feedback";
  title: string;
  description: string;
  date: string;
  sentiment?: Sentiment;
  participants?: string[];
}

export interface Delivery {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "blocked" | "completed" | "delayed";
  progress: number;
  dueDate: string;
  assignee: string;
  blockers?: string[];
  impact: "high" | "medium" | "low";
}

export interface UsageDataPoint {
  date: string;
  activeUsers: number;
  sessions: number;
  features: Record<string, number>;
}

export interface PriorityItem {
  id: string;
  accountId: string;
  accountName: string;
  reason: string;
  reasonType: "risk" | "delivery" | "adoption" | "sentiment" | "expansion" | "silence";
  priority: Priority;
  recommendedAction: string;
  impact: string;
  effort: "low" | "medium" | "high";
  dueDate?: string;
}

export interface AIInsight {
  id: string;
  accountId?: string;
  accountName?: string;
  csOwnerId?: string;
  csOwnerName?: string;
  squadId?: string;
  squadName?: string;
  insight: string;
  evidence: string[];
  source: string;
  confidence: ConfidenceLevel;
  actionSuggested: string;
  expectedOutcome: string;
  riskIfIgnored: string;
  type: InsightType;
  status: InsightStatus;
  scope: InsightScope;
  feedback?: string;
  actionTaken: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: "activity_drop" | "delivery_delay" | "negative_sentiment" | "no_response" | "churn_risk" | "expansion_opportunity";
  severity: Priority;
  title: string;
  description: string;
  accountId: string;
  accountName: string;
  detectedAt: string;
  action?: string;
}

export interface Squad {
  id: string;
  name: string;
  members: string[];
  capacity: number;
  currentLoad: number;
  accountsCount: number;
  blockedItems: number;
}

export interface PortfolioHealth {
  total: number;
  healthy: number;
  attention: number;
  risk: number;
  critical: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

export interface DailyProgress {
  completed: number;
  total: number;
  completedItems: CompletedAction[];
}

export interface CompletedAction {
  id: string;
  accountName: string;
  action: string;
  completedAt: string;
  completedBy: string;
}

export interface FilterState {
  period: string;
  segment: string[];
  plan: string[];
  squad: string[];
  csOwner: string[];
  status: HealthStatus[];
  risk: string[];
  tags: string[];
}
