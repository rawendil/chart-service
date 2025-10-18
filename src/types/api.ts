import { ChartType, Theme } from './database';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerateChartRequest {
  title?: string;
  description?: string;
  chartType?: ChartType;
  data?: ChartData;
  width?: number;
  height?: number;
  theme?: Theme;
  isPublic?: boolean;
  expiresAt?: string;
  chartConfig?: ChartConfig;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  type?: string;
}

export interface ChartConfig {
  type: ChartType;
  options: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: string;
      };
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    scales?: {
      x?: any;
      y?: any;
    };
    elements?: {
      point?: {
        radius?: number;
      };
      line?: {
        tension?: number;
      };
    };
  };
}

export interface UpdateChartRequest {
  title?: string;
  description?: string;
  data?: ChartData;
  chartConfig?: ChartConfig;
  width?: number;
  height?: number;
  theme?: Theme;
  isPublic?: boolean;
  expiresAt?: string;
}

export interface ChartResponse {
  id: string;
  chart_hash: string;
  title?: string;
  description?: string;
  chart_type: ChartType;
  width: number;
  height: number;
  theme: Theme;
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  access_url: string;
  embed_url: string;
  png_url: string;
  json_url: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: ValidationError[];
}