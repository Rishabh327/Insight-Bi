import { GoogleGenAI, Type } from "@google/genai";
import { ColumnMetadata, DataItem, WidgetConfig, AIInsightResponse, ChartType } from '../types';

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Analyzes the columns and suggests a dashboard layout
export const suggestDashboardLayout = async (columns: ColumnMetadata[], sampleData: DataItem[]): Promise<WidgetConfig[]> => {
  const ai = getAIClient();
  if (!ai) return [];

  const schemaDescription = columns.map(c => `${c.name} (${c.type})`).join(', ');
  const sampleJson = JSON.stringify(sampleData.slice(0, 5));

  const prompt = `
    I have a dataset for a Car Sales Dashboard with the following columns: ${schemaDescription}.
    Sample data: ${sampleJson}.
    
    Please create a configuration for 6 dashboard widgets to visualize this data effectively.
    Include a mix of KPIs, Bar charts, Line charts, and Pie charts.
    
    For 'KPI' types, pick a numeric column for yAxisKey (e.g. Price, Revenue) and aggregation 'sum'.
    For 'Line' charts, usually use a Date column for xAxisKey.
    For 'Bar' or 'Pie', use categorical columns for xAxisKey.
    
    Return a JSON array of widget configurations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(ChartType) },
              xAxisKey: { type: Type.STRING, description: "Column name for X Axis or Category" },
              yAxisKey: { type: Type.STRING, description: "Column name for Y Axis or Value" },
              aggregation: { type: Type.STRING, enum: ['sum', 'avg', 'count'] },
              colSpan: { type: Type.INTEGER, description: "1, 2, or 3" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const widgets = JSON.parse(text) as WidgetConfig[];
    // Ensure IDs are unique just in case
    return widgets.map((w, i) => ({...w, id: `gen_w_${i}_${Date.now()}`}));

  } catch (error) {
    console.error("Gemini Layout Gen Error:", error);
    return [];
  }
};

export const generateDashboardInsights = async (data: DataItem[], userQuery?: string): Promise<AIInsightResponse | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  // Summarize data to prevent token overflow
  const sampleData = data.slice(0, 50); 
  const contextData = JSON.stringify(sampleData);

  const basePrompt = `
    You are a senior automotive business intelligence analyst. Analyze the provided car sales data.
    Data (first 50 rows): ${contextData}
  `;

  const specificPrompt = userQuery 
    ? `Answer this specific question based on the data: "${userQuery}".`
    : `Provide a high-level executive summary, 3 specific key trends (mentioning specific models or regions if possible), and 1 actionable strategic recommendation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${basePrompt}\n${specificPrompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIInsightResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const askAIAboutData = async (data: DataItem[], query: string): Promise<string> => {
   const ai = getAIClient();
  if (!ai) return "AI Service Unavailable";

  // 1. Analyze Schema & Calculate Stats
  // We calculate stats so the AI knows the totals/averages without needing to see every single row (which might exceed token limits).
  const keys = Object.keys(data[0] || {});
  const stats: Record<string, any> = {};
  
  if (data.length > 0) {
      keys.forEach(key => {
          const firstVal = data[0][key];
          if (typeof firstVal === 'number') {
              let sum = 0;
              let min = Number(firstVal);
              let max = Number(firstVal);
              
              data.forEach(row => {
                  const val = Number(row[key]) || 0;
                  sum += val;
                  if (val < min) min = val;
                  if (val > max) max = val;
              });

              stats[key] = {
                  sum: Math.round(sum),
                  average: Math.round(sum / data.length),
                  min,
                  max
              };
          }
      });
  }

  // 2. Prepare Context
  // Send stats + a sample of rows
  const sampleData = JSON.stringify(data.slice(0, 30)); 
  const statsData = JSON.stringify(stats);
  const totalRows = data.length;

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a helpful data analyst assistant for a business dashboard.
        
        Dataset Overview:
        - Total Rows: ${totalRows}
        - Column Statistics (Sums/Avgs/Min/Max for numeric fields): ${statsData}
        - Data Sample (First 30 rows): ${sampleData}
        
        User Question: ${query}
        
        Instructions:
        - Use the 'Column Statistics' to answer questions about totals, averages, or ranges.
        - Use the 'Data Sample' to understand categorical values and context.
        - Be concise, professional, and direct.
      `,
    });
    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error processing your request. Please check your API key.";
  }
}