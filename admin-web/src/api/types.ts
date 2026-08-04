export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface ProviderUsage {
  provider: string;
  displayName: string;
  count: number;
}

export interface Stats {
  totalUsers: number;
  admins: number;
  banned: number;
  totalGenerations: number;
  todayGenerations: number;
  activeToday: number;
  last7Days: DayCount[];
  perProvider: ProviderUsage[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  provider: string;
  dailyQuota: number;
  banned: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  usedToday: number;
}

export interface ProviderModel {
  id: string;
  internalName: string;
  displayName: string;
  enabled: boolean;
  hidden: boolean;
  supportsImages: boolean;
  supportsVision: boolean;
  supportsVideo: boolean;
  maxTokens: number | null;
  costPer1kIn: number;
  costPer1kOut: number;
}

export interface ProviderCredential {
  id: string;
  label: string;
  enabled: boolean;
  priority: number;
  failureStreak: number;
  lastUsedAt: string | null;
  lastError: string | null;
  apiKeyConfigured: boolean;
  apiKeyMasked: string | null;
}

export interface ProviderAdmin {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  maxRpm: number;
  maxTpm: number;
  supportsImages: boolean;
  supportsVision: boolean;
  supportsVideo: boolean;
  healthStatus: string;
  failureStreak: number;
  apiKeyConfigured: boolean;
  models: ProviderModel[];
  credentials: ProviderCredential[];
  apiKeyMasked: string | null;
  updatedAt: string;
}

export interface ToolParamField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'slider' | 'textarea' | 'file';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface ToolAdmin {
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  capability: 'image' | 'video' | 'text' | 'mask' | 'audio';
  requiresInput: boolean;
  enabled: boolean;
  paramSchema: ToolParamField[] | null;
  defaultBinding: Array<{ provider: string; model: string }> | null;
  updatedAt: string;
}

export interface StorageAsset {
  id: string;
  executionId: string | null;
  workflowId: string | null;
  nodeId: string | null;
  tool: string;
  provider: string | null;
  model: string | null;
  kind: 'image' | 'video' | 'audio' | 'file';
  mime: string | null;
  url: string | null;
  localPath: string | null;
  sizeBytes: number;
  createdBy: string | null;
  createdAt: string;
}

export interface RoutingVariableRoute {
  id: string;
  order: number;
  model: {
    id: string;
    internalName: string;
    displayName: string;
    enabled: boolean;
    supportsImages: boolean;
    provider: {
      id: string;
      name: string;
      displayName: string;
      enabled: boolean;
      supportsImages: boolean;
    };
  };
}

export interface RoutingVariable {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  routes: RoutingVariableRoute[];
}

export type StorageDriver = 'local' | 'cloudinary' | 's3' | 'r2' | 'supabase';

export interface StorageProvider {
  id: string;
  name: string;
  driver: StorageDriver;
  enabled: boolean;
  isActive: boolean;
  priority: number;
  configConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelRouteStep {
  provider: string;
  model: string;
  priority?: number;
}

export interface ModelRoute {
  id: string;
  name: string;
  description: string | null;
  steps: ModelRouteStep[];
  retryPolicy: Record<string, unknown>;
  enabled: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodeDefinitionPort {
  id?: string;
  label?: string;
  type?: string;
  source?: string;
}

export interface NodeDefinitionParam {
  key: string;
  label?: string;
  type?: 'text' | 'number' | 'select' | 'toggle' | 'slider' | 'textarea' | 'file';
  options?: Array<string | { value: string; label: string }>;
  placeholder?: string;
  default?: unknown;
  source?: string;
}

export interface NodeDefinition {
  key: string;
  kind: string;
  category: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  inputPorts: NodeDefinitionPort[];
  outputPorts: NodeDefinitionPort[];
  paramSchema: NodeDefinitionParam[];
  defaults: Record<string, unknown>;
  enabled: boolean;
  hasRuntime: boolean;
  updatedAt: string;
}

export interface NodeLibrary {
  definitions: NodeDefinition[];
  capabilities: Array<
    NodeDefinition & {
      capability: string;
      requiresInput: boolean;
      hasRuntime: boolean;
      defaultChain: Array<{ provider: string; model: string }>;
    }
  >;
  providers: Array<{ id: string; name: string; displayName: string; enabled: boolean }>;
  storageProviders: Array<{
    id: string;
    name: string;
    driver: string;
    enabled: boolean;
    isActive: boolean;
    priority: number;
    configConfigured: boolean;
  }>;
  modelRoutes: Array<{ id: string; name: string; enabled: boolean }>;
}

export interface ProviderTestResult {
  ok: boolean;
  latencyMs: number;
  status: number;
  message: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
  actorEmail: string | null;
}

export interface SettingsMap {
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  version: number;
  webhookUrl?: string | null;
  projectId?: string | null;
  clientEnabled?: boolean;
  clientModelName?: string | null;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
}

export interface WorkflowDetail extends WorkflowSummary {
  graph: WorkflowGraph;
}

export interface ExecutionLogLine {
  ts: string;
  level: string;
  source: string;
  message: string;
}

export interface ExecutionAttempt {
  attempt: number;
  provider: string;
  model: string;
  status: 'success' | 'error' | 'skipped';
  error: string | null;
  latencyMs: number;
  costUsd: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: Record<string, unknown> | null;
  logs: ExecutionLogLine[] | null;
  attempts: ExecutionAttempt[] | null;
  tokensIn: number;
  tokensOut: number;
  images: number;
  costUsd: number;
  providerUsed: string | null;
  modelUsed: string | null;
  durationMs: number;
  error: string | null;
  output: Record<string, unknown> | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface AdminExecutionRow {
  id: string;
  workflowId: string;
  workflow: { id: string; name: string; enabled: boolean };
  projectId: string | null;
  source: 'admin' | 'client';
  createdBy: string | null;
  status: 'pending' | 'running' | 'success' | 'error';
  images: number;
  costUsd: number;
  providerUsed: string | null;
  modelUsed: string | null;
  durationMs: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  user: { id: string; email: string; name: string | null } | null;
}

export interface AdminExecutionList {
  total: number;
  rows: AdminExecutionRow[];
}
