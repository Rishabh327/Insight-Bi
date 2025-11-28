export enum ChartType {
  BAR = 'Bar',
  LINE = 'Line',
  AREA = 'Area',
  PIE = 'Pie',
  SCATTER = 'Scatter',
  KPI = 'KPI'
}

export interface DataItem {
  [key: string]: string | number;
}

export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date';
}

export interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxisKey: string; // The dimension (e.g., Car Model, Date)
  yAxisKey: string; // The metric (e.g., Selling Price, Commission)
  aggregation: 'sum' | 'avg' | 'count';
  colSpan: number; // Grid column span (1, 2, or 3)
}

export interface AIInsightResponse {
  summary: string;
  keyTrends: string[];
  recommendation: string;
}

export interface DashboardState {
  data: DataItem[];
  columns: ColumnMetadata[];
  widgets: WidgetConfig[];
}