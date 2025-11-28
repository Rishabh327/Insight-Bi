import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart
} from 'recharts';
import { ChartType, WidgetConfig, DataItem } from '../types';

interface ChartRendererProps {
  widget: WidgetConfig;
  data: DataItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded-sm text-sm z-50">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartRenderer: React.FC<ChartRendererProps> = ({ widget, data }) => {
  
  // Aggregate data based on widget config
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (widget.type === ChartType.SCATTER) return data; // Scatter typically uses raw data points

    const { xAxisKey, yAxisKey, aggregation } = widget;
    
    const grouped: Record<string, { sum: number; count: number }> = {};

    data.forEach(item => {
        const xVal = String(item[xAxisKey] || 'Unknown');
        const yVal = Number(item[yAxisKey]) || 0;

        if (!grouped[xVal]) {
            grouped[xVal] = { sum: 0, count: 0 };
        }
        grouped[xVal].sum += yVal;
        grouped[xVal].count += 1;
    });

    return Object.keys(grouped).map(key => {
        const { sum, count } = grouped[key];
        let value = 0;
        if (aggregation === 'avg' && count > 0) value = Math.round(sum / count);
        else if (aggregation === 'count') value = count;
        else value = sum; // default to sum

        return {
            [xAxisKey]: key,
            [yAxisKey]: value
        };
    }); // Sort could be added here if needed
  }, [data, widget]);


  // KPIs are special
  if (widget.type === ChartType.KPI) {
     const totalValue = processedData.reduce((acc, curr: any) => acc + (Number(curr[widget.yAxisKey]) || 0), 0);
     const displayValue = totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
     
     return (
         <div className="flex flex-col items-center justify-center h-full text-gray-700 p-4">
             <span className="text-sm font-medium uppercase tracking-wider opacity-70 text-center">{widget.title}</span>
             <span className="text-4xl font-bold text-blue-600 mt-2">{displayValue}</span>
             <span className="text-xs text-gray-400 mt-2 font-medium">Aggregated: {widget.aggregation} of {widget.yAxisKey}</span>
         </div>
     )
  }

  if (processedData.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available for selected keys</div>;
  }

  const renderChart = () => {
    const xKey = widget.xAxisKey;
    const yKey = widget.yAxisKey;

    switch (widget.type) {
      case ChartType.LINE:
        return (
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} interval="preserveStartEnd" />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: '12px'}} />
            <Line type="monotone" dataKey={yKey} stroke="#2563eb" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
          </LineChart>
        );
      case ChartType.BAR:
        return (
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: '12px'}} />
            <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        );
      case ChartType.AREA:
        return (
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id={`color${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={yKey} stroke="#2563eb" fillOpacity={1} fill={`url(#color${widget.id})`} />
          </AreaChart>
        );
      case ChartType.PIE:
        return (
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey={yKey}
              nameKey={xKey}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}} />
          </PieChart>
        );
       case ChartType.SCATTER:
        return (
          <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey={xKey} name={xKey} type="number" label={{ value: xKey, position: 'insideBottomRight', offset: -10 }} />
             <YAxis dataKey={yKey} name={yKey} type="number" label={{ value: yKey, angle: -90, position: 'insideLeft' }} />
             <Tooltip cursor={{ strokeDasharray: '3 3' }} />
             <Scatter name={`${xKey} vs ${yKey}`} data={data} fill="#8884d8" />
          </ScatterChart>
        )
      default:
        return <div className="flex items-center justify-center h-full text-gray-400">Unknown Chart Type</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default ChartRenderer;