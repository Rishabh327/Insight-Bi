import React from 'react';
import { WidgetConfig, ChartType, ColumnMetadata } from '../types';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  ScatterChart, 
  CreditCard, 
  Trash2, 
  LayoutTemplate,
  Hash,
  Calendar,
  Type as TypeIcon,
  MousePointer2
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedWidget: WidgetConfig | null;
  availableColumns: ColumnMetadata[];
  onUpdateWidget: (updatedWidget: WidgetConfig) => void;
  onAddWidget: (type: ChartType) => void;
  onDeleteWidget: (id: string) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedWidget, 
  availableColumns, 
  onUpdateWidget, 
  onAddWidget, 
  onDeleteWidget, 
  onClose 
}) => {

  const chartOptions = [
    { type: ChartType.BAR, icon: BarChart3, label: 'Bar Chart' },
    { type: ChartType.LINE, icon: LineChart, label: 'Line Chart' },
    { type: ChartType.AREA, icon: Activity, label: 'Area Chart' },
    { type: ChartType.PIE, icon: PieChart, label: 'Pie Chart' },
    { type: ChartType.SCATTER, icon: ScatterChart, label: 'Scatter' },
    { type: ChartType.KPI, icon: CreditCard, label: 'Card' },
  ];

  const getColumnIcon = (type: string) => {
    switch (type) {
        case 'number': return <Hash size={14} className="text-teal-600" />;
        case 'date': return <Calendar size={14} className="text-blue-600" />;
        default: return <TypeIcon size={14} className="text-gray-500" />;
    }
  };

  // ----------------------------------------------------------------------
  // RENDER: NO SELECTION (Build Mode)
  // ----------------------------------------------------------------------
  if (!selectedWidget) {
    return (
        <div className="w-72 h-full bg-white border-l border-gray-200 shadow-sm flex flex-col z-20">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-xs uppercase tracking-wider text-gray-500">Visualizations</span>
            </div>
            
            {/* Visualization Gallery */}
            <div className="p-4 grid grid-cols-4 gap-2 border-b border-gray-200">
                {chartOptions.map((opt) => (
                    <button
                        key={opt.type}
                        onClick={() => onAddWidget(opt.type)}
                        className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group relative"
                        title={`Add ${opt.label}`}
                    >
                        <opt.icon size={24} className="text-gray-600 group-hover:text-teal-600 mb-1" />
                    </button>
                ))}
            </div>

            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <span className="font-semibold text-xs uppercase tracking-wider text-gray-500">Data Fields</span>
            </div>

            {/* Data Fields List */}
            <div className="flex-1 overflow-y-auto p-2">
                 {availableColumns.length === 0 ? (
                     <div className="text-center text-gray-400 text-xs py-4">No data loaded</div>
                 ) : (
                     <div className="space-y-1">
                         {availableColumns.map(col => (
                             <div key={col.name} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-default text-sm text-gray-700 group">
                                 {getColumnIcon(col.type)}
                                 <span className="truncate">{col.name}</span>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
            
            <div className="p-4 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-200">
                Select a visual type above to add it to the canvas.
            </div>
        </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: SELECTION MODE (Edit Mode)
  // ----------------------------------------------------------------------

  const handleTypeChange = (newType: ChartType) => {
    onUpdateWidget({ ...selectedWidget, type: newType });
  };

  // Filter columns for sensible defaults
  const numericColumns = availableColumns.filter(c => c.type === 'number');

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 shadow-xl flex flex-col z-20">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800">Format Visual</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-lg" title="Close panel">×</button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        
        {/* Chart Type Selector */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Visual Type</h4>
          <div className="grid grid-cols-3 gap-2">
            {chartOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleTypeChange(opt.type)}
                className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                  selectedWidget.type === opt.type
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <opt.icon size={20} className="mb-1" />
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Axis Configuration */}
        <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Data Axes</h4>
            
            {/* X-Axis */}
            {selectedWidget.type !== ChartType.KPI && (
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 font-medium">
                   X-Axis / Category
                </label>
                <div className="relative">
                    <select
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:border-teal-500 outline-none appearance-none"
                    value={selectedWidget.xAxisKey}
                    onChange={(e) => onUpdateWidget({...selectedWidget, xAxisKey: e.target.value})}
                    >
                    {availableColumns.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                        <MousePointer2 size={12} className="rotate-90" />
                    </div>
                </div>
              </div>
            )}

            {/* Y-Axis */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 font-medium">
                   Y-Axis / Values
              </label>
              <div className="relative">
                  <select
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:border-teal-500 outline-none appearance-none"
                    value={selectedWidget.yAxisKey}
                    onChange={(e) => onUpdateWidget({...selectedWidget, yAxisKey: e.target.value})}
                  >
                    {(numericColumns.length > 0 ? numericColumns : availableColumns).map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                        <MousePointer2 size={12} className="rotate-90" />
                  </div>
               </div>
            </div>

            {/* Aggregation */}
             {selectedWidget.type !== ChartType.SCATTER && (
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium">Aggregation</label>
                   <div className="flex bg-gray-100 p-1 rounded border border-gray-200">
                       {['sum', 'avg', 'count'].map(agg => (
                           <button
                                key={agg}
                                onClick={() => onUpdateWidget({...selectedWidget, aggregation: agg as any})}
                                className={`flex-1 text-xs py-1 rounded capitalize ${selectedWidget.aggregation === agg ? 'bg-white shadow text-teal-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                           >
                               {agg}
                           </button>
                       ))}
                   </div>
                </div>
             )}
        </div>

        {/* General Settings */}
        <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">General</h4>
            <div className="space-y-4">
                 <div>
                    <label className="block text-xs text-gray-600 mb-1.5 font-medium">Title</label>
                    <input 
                        type="text" 
                        value={selectedWidget.title}
                        onChange={(e) => onUpdateWidget({...selectedWidget, title: e.target.value})}
                        className="border border-gray-300 rounded px-2 py-2 text-sm w-full focus:border-teal-500 outline-none"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs text-gray-600 mb-1.5 font-medium">Widget Width</label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(span => (
                            <button
                                key={span}
                                onClick={() => onUpdateWidget({...selectedWidget, colSpan: span})}
                                className={`flex-1 py-2 text-xs border rounded transition-colors ${selectedWidget.colSpan === span ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                {span === 1 ? '1/3' : span === 2 ? '2/3' : 'Full'}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-gray-200">
            <button 
                onClick={() => onDeleteWidget(selectedWidget.id)}
                className="w-full flex items-center justify-center gap-2 p-2 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
                <Trash2 size={16} />
                <span className="text-sm font-medium">Remove Visual</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;