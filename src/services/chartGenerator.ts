import puppeteer from 'puppeteer';
import { ChartType, ChartData, ChartConfiguration } from 'chart.js';
import { Logger } from '../utils/logger';
import { ChartType as CustomChartType, Theme } from '../types/database';
import * as fs from 'fs';
import * as path from 'path';

export class ChartGeneratorService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.logger.info('Chart generator service initialized');
  }

  async generateChart(
    chartType: CustomChartType,
    data: ChartData,
    options: {
      width?: number;
      height?: number;
      theme?: Theme;
      title?: string;
      backgroundColor?: string;
    } = {}
  ): Promise<Buffer> {
    let browser;
    try {
      const {
        width = 800,
        height = 600,
        theme = 'light',
        title,
        backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff'
      } = options;

      this.logger.info('Generating chart with Puppeteer', {
        type: chartType,
        width,
        height,
        theme,
        datasets: data.datasets.length
      });

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width, height });

      // Create Chart.js HTML
      const chartJsConfig = this.createChartJsConfig(chartType, data, {
        width,
        height,
        theme,
        ...(title && { title }),
        backgroundColor
      });

      // Generate HTML content
      const htmlContent = this.generateHtmlContent(chartJsConfig, {
        width,
        height,
        theme,
        backgroundColor
      });

      // Set page content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Wait for chart to render
      await page.waitForSelector('#chart-container canvas', { timeout: 10000 });

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        clip: { x: 0, y: 0, width, height },
        type: 'png'
      });

      this.logger.info('Chart generated successfully', {
        size: screenshotBuffer.length,
        type: chartType
      });

      return screenshotBuffer;
    } catch (error) {
      this.logger.error('Failed to generate chart with Puppeteer', error);
      throw new Error(`Chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private createChartJsConfig(
    chartType: CustomChartType,
    data: ChartData,
    options: {
      width: number;
      height: number;
      theme: Theme;
      title?: string;
      backgroundColor: string;
    }
  ) {
    return {
      type: this.mapCustomChartType(chartType),
      data: {
        labels: data.labels || [],
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: this.getBackgroundColors(dataset.backgroundColor, chartType, options.theme),
          borderColor: this.getBorderColors(dataset.borderColor, chartType, options.theme),
          borderWidth: dataset.borderWidth || 2,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: data.datasets.length > 1,
            position: 'top',
            labels: {
              color: options.theme === 'dark' ? '#ffffff' : '#000000',
              font: {
                size: 12
              }
            }
          },
          title: {
            display: !!options.title,
            text: options.title,
            color: options.theme === 'dark' ? '#ffffff' : '#000000',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          }
        },
        scales: this.getScaleOptions(chartType, options.theme),
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          },
          line: {
            tension: 0.3
          }
        }
      }
    };
  }

  private generateHtmlContent(
    chartConfig: any,
    options: {
      width: number;
      height: number;
      theme: Theme;
      backgroundColor: string;
    }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Chart Generation</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: ${options.backgroundColor};
          }
          #chart-container {
            width: ${options.width}px;
            height: ${options.height}px;
            background: ${options.backgroundColor};
          }
        </style>
      </head>
      <body>
        <div id="chart-container">
          <canvas id="chart-canvas"></canvas>
        </div>
        <script>
          const ctx = document.getElementById('chart-canvas').getContext('2d');
          new Chart(ctx, ${JSON.stringify(chartConfig)});
        </script>
      </body>
      </html>
    `;
  }

  private mapCustomChartType(customType: CustomChartType): ChartType {
    const typeMap: Record<CustomChartType, ChartType> = {
      'line': 'line',
      'bar': 'bar',
      'pie': 'pie',
      'doughnut': 'doughnut',
      'radar': 'radar',
      'polarArea': 'polarArea',
      'scatter': 'scatter',
      'bubble': 'bubble',
      'mixed': 'line' // Default to line for mixed charts
    };

    return typeMap[customType] || 'line';
  }

  private getBackgroundColors(
    providedColors: string | string[] | undefined,
    chartType: CustomChartType,
    theme: Theme
  ): string | string[] {
    if (providedColors) {
      return providedColors;
    }

    // Default color palettes based on chart type and theme
    const colorPalettes = {
      light: {
        line: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        bar: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        pie: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        doughnut: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        radar: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        polarArea: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        scatter: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        bubble: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        mixed: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      },
      dark: {
        line: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        bar: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        pie: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        doughnut: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        radar: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        polarArea: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        scatter: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        bubble: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'],
        mixed: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6']
      }
    };

    return colorPalettes[theme as keyof typeof colorPalettes][chartType] || colorPalettes[theme as keyof typeof colorPalettes].line;
  }

  private getBorderColors(
    providedColors: string | string[] | undefined,
    chartType: CustomChartType,
    theme: Theme
  ): string | string[] {
    if (providedColors) {
      return providedColors;
    }

    // For most chart types, border colors match background colors
    return this.getBackgroundColors(undefined, chartType, theme);
  }

  private getScaleOptions(chartType: CustomChartType, theme: Theme) {
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    const baseOptions = {
      x: {
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
          borderColor: gridColor
        }
      },
      y: {
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
          borderColor: gridColor
        }
      }
    };

    // Special scale options for specific chart types
    if (chartType === 'radar') {
      return {
        r: {
          ticks: {
            color: textColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor,
            font: {
              size: 12
            }
          }
        }
      };
    }

    return baseOptions;
  }
}