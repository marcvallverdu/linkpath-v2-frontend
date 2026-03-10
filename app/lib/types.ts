export type TestDepth = "redirect" | "landing" | "checkout";
export type BrowserProfile =
  | "chrome"
  | "safari"
  | "mobile-chrome"
  | "mobile-safari";
export type ConsentMode =
  | "accept_all"
  | "reject_all"
  | "manage_necessary_only";

export type IssueSeverity = "error" | "warning" | "info";

export type TestRequest = {
  url: string;
  depth?: TestDepth;
  expectCookies?: string[];
  browserProfile?: BrowserProfile;
  consentMode?: ConsentMode;
  consentCompare?: boolean;
  productSelector?: string;
  addToCartSelector?: string;
  model?: string;
  maxTurns?: number;
  proxy?: string;
  device?: string;
};

export type TestJobResponse = {
  jobId: string;
  status: string;
  statusUrl: string;
};

export type TestStatusResponse = {
  jobId: string;
  status: string;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string;
  result?: Record<string, unknown>;
};

export type HistoryItem = {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  result: Record<string, unknown> | null;
};
