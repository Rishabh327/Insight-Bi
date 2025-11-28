import React, { useState, useRef, useEffect } from 'react';
import { 
    LayoutDashboard, 
    BarChart3, 
    Settings, 
    HelpCircle, 
    ChevronDown,
    Bot,
    Search,
    Plus,
    MoreHorizontal,
    UploadCloud,
    FileSpreadsheet,
    Loader2,
    Menu
} from 'lucide-react';
import { WidgetConfig, DataItem, ColumnMetadata, ChartType } from './types';
import { SAMPLE_CSV_DATA } from './constants';
import { suggestDashboardLayout } from './services/geminiService';
import ChartRenderer from './components/ChartRenderer';
import PropertiesPanel from './components/PropertiesPanel';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
    // State
    const [data, setData] = useState<DataItem[]>([]);
    const [columns, setColumns] = useState<ColumnMetadata[]>([]);
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedWidget = widgets.find(w => w.id === selectedWidgetId) || null;

    // CSV Parsing Logic
    const parseCSV = (text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return { data: [], columns: [] };

        const headers = lines[0].split(',').map(h => h.trim());
        
        const parsedData: DataItem[] = [];
        
        // Parse rows
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) continue;

            const row: DataItem = {};
            values.forEach((val, index) => {
                const cleanVal = val.trim();
                // Simple number detection
                const numVal = Number(cleanVal);
                row[headers[index]] = !isNaN(numVal) && cleanVal !== '' ? numVal : cleanVal;
            });
            parsedData.push(row);
        }

        // Analyze Column Types
        const columnMeta: ColumnMetadata[] = headers.map(header => {
            const sampleValue = parsedData[0]?.[header];
            const isNumber = typeof sampleValue === 'number';
            // Simple date check (very basic)
            const isDate = !isNumber && !isNaN(Date.parse(String(sampleValue)));
            
            return {
                name: header,
                type: isNumber ? 'number' : (isDate ? 'date' : 'string')
            };
        });

        return { data: parsedData, columns: columnMeta };
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            await processRawCSV(text);
        };
        reader.readAsText(file);
    };

    const loadSampleData = async () => {
        await processRawCSV(SAMPLE_CSV_DATA);
    };

    const processRawCSV = async (csvText: string) => {
        setIsProcessing(true);
        setUploadError(null);
        try {
            const { data: parsedData, columns: parsedColumns } = parseCSV(csvText);
            
            if (parsedData.length === 0) {
                setUploadError("Could not parse data. Check CSV format.");
                setIsProcessing(false);
                return;
            }

            setData(parsedData);
            setColumns(parsedColumns);

            // Generate Layout via AI
            const suggestedWidgets = await suggestDashboardLayout(parsedColumns, parsedData);
            setWidgets(suggestedWidgets);

        } catch (err) {
            console.error(err);
            setUploadError("Error processing file.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddWidget = (type: ChartType = ChartType.BAR) => {
        // Smart Defaults
        const xAxisKey = columns.find(c => c.type === 'string' || c.type === 'date')?.name || columns[0]?.name || '';
        const yAxisKey = columns.find(c => c.type === 'number')?.name || columns[0]?.name || '';

        const newWidget: WidgetConfig = {
            id: `w_${Date.now()}`,
            title: `New ${type} Chart`,
            type: type,
            xAxisKey,
            yAxisKey,
            aggregation: 'sum',
            colSpan: 1
        };
        setWidgets([...widgets, newWidget]);
        setSelectedWidgetId(newWidget.id);
    };

    const handleDeleteWidget = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
        if (selectedWidgetId === id) setSelectedWidgetId(null);
    };

    const handleUpdateWidget = (updated: WidgetConfig) => {
        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    // Render Upload Screen if no data
    if (data.length === 0) {
        return (
             <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-200">
                    <div className="h-16 w-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileSpreadsheet size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Car Sales Dashboard</h1>
                    <p className="text-gray-500 mb-8">Upload your CSV file to generate an AI-powered interactive dashboard.</p>
                    
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-8 text-teal-600">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <span className="text-sm font-medium">Analyzing Data & Building Layout...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 hover:border-teal-500 transition-all group"
                            >
                                <UploadCloud className="mx-auto h-10 w-10 text-gray-400 group-hover:text-teal-500 mb-2" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">Click to upload CSV</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept=".csv" 
                                    className="hidden" 
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or</span></div>
                            </div>
                            <button 
                                onClick={loadSampleData}
                                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Load Sample Car Sales Data
                            </button>
                            {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-14 bg-[#f3f4f6] border-r border-gray-300 flex flex-col items-center py-4 z-30 flex-shrink-0">
                <div className="mb-6 p-1.5 bg-teal-600 rounded text-white shadow-sm">
                    <BarChart3 size={20} />
                </div>
                <nav className="flex-1 space-y-4 w-full flex flex-col items-center">
                    <button className="p-2 bg-white border border-gray-300 rounded shadow-sm text-teal-700 relative group" title="Report View">
                        <LayoutDashboard size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-teal-700 transition-colors" title="Table View">
                        <FileSpreadsheet size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-teal-700 transition-colors" title="Model View">
                        <Settings size={20} />
                    </button>
                </nav>
                <button className="p-2 text-gray-500 hover:text-gray-800 mt-auto">
                    <HelpCircle size={20} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="text-teal-800 font-semibold tracking-tight">AutoSales Analytics</div>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            <FileSpreadsheet size={12} />
                            <span>{data.length} rows</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsAIOpen(!isAIOpen)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                                isAIOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Bot size={14} className={isAIOpen ? "text-blue-600" : "text-purple-600"} />
                            Copilot Insights
                        </button>
                        <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                            JD
                        </div>
                    </div>
                </header>

                {/* Canvas */}
                <main className="flex-1 overflow-y-auto p-6 relative bg-[#eaeaea]" onClick={() => setSelectedWidgetId(null)}>
                    <div className="max-w-full mx-auto">
                        {/* Toolbar / Canvas Header */}
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-lg font-bold text-gray-700">Dashboard Page 1</h2>
                             <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAddWidget(ChartType.BAR); }}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-sm text-xs font-medium shadow-sm"
                                >
                                    <Plus size={14} />
                                    Quick Add
                                </button>
                             </div>
                        </div>

                        {/* Grid System */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                            {widgets.map(widget => (
                                <div 
                                    key={widget.id} 
                                    className={`
                                        bg-white rounded border shadow-sm transition-all duration-100 flex flex-col overflow-hidden
                                        ${widget.colSpan === 2 ? 'md:col-span-2' : ''}
                                        ${widget.colSpan === 3 ? 'lg:col-span-3 md:col-span-2' : ''}
                                        ${selectedWidgetId === widget.id ? 'ring-2 ring-teal-500 border-teal-500 z-10' : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                    style={{ height: '320px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedWidgetId(widget.id);
                                    }}
                                >
                                    {/* Widget Header */}
                                    <div className={`px-3 py-2 border-b border-gray-100 flex justify-between items-center handle cursor-move ${selectedWidgetId === widget.id ? 'bg-teal-50' : 'bg-white'}`}>
                                        <h3 className="font-semibold text-gray-700 text-xs truncate uppercase tracking-wide">{widget.title}</h3>
                                        <div className="flex items-center gap-2 text-gray-400">
                                             <MoreHorizontal size={14}/>
                                        </div>
                                    </div>

                                    {/* Widget Body */}
                                    <div className="flex-1 p-2 min-h-0">
                                        <ChartRenderer widget={widget} data={data} />
                                    </div>
                                </div>
                            ))}
                            
                            {/* Empty State hint if no widgets */}
                            {widgets.length === 0 && (
                                <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <LayoutDashboard size={48} className="mb-4 opacity-30" />
                                    <p className="text-sm">Start building your report.</p>
                                    <p className="text-xs mt-1">Select a visual from the pane on the right.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Right Panels (Visualizations & AI) */}
            <div className="flex flex-row z-40 h-full border-l border-gray-300 bg-white shadow-sm flex-shrink-0">
                 
                 {/* Visualizations / Properties Panel (Always visible unless AI covers it, or we can stack them. For MVP side-by-side or toggle is fine. 
                    I will hide Viz panel if AI is open to save space, or just show Viz panel if AI is closed) */}
                 {!isAIOpen && (
                    <PropertiesPanel 
                        selectedWidget={selectedWidget} 
                        availableColumns={columns}
                        onUpdateWidget={handleUpdateWidget}
                        onAddWidget={handleAddWidget}
                        onDeleteWidget={handleDeleteWidget}
                        onClose={() => setSelectedWidgetId(null)}
                    />
                 )}
                 
                 <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} data={data} />
            </div>
        </div>
    );
};

export default App;