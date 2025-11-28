import { WidgetConfig, ChartType } from './types';

// Fallback sample CSV if user doesn't have one
export const SAMPLE_CSV_DATA = `Date,Car Model,Manufacturer,Dealer Region,Sales Person,Selling Price,Cost Price,Units Sold
2023-01-15,Civic,Honda,North,John Doe,25000,22000,5
2023-01-16,Accord,Honda,South,Jane Smith,32000,28000,3
2023-01-20,Mustang,Ford,East,Bob Johnson,45000,38000,2
2023-02-05,F-150,Ford,West,Alice Brown,55000,48000,8
2023-02-10,Model 3,Tesla,North,John Doe,42000,36000,12
2023-02-15,Camry,Toyota,South,Jane Smith,28000,24000,6
2023-03-01,Corolla,Toyota,East,Bob Johnson,22000,19000,10
2023-03-05,Civic,Honda,West,Alice Brown,26000,22500,4
2023-03-10,Model Y,Tesla,North,Mike Wilson,52000,45000,7
2023-03-15,F-150,Ford,South,Sarah Davis,56000,49000,5
2023-04-01,Explorer,Ford,East,Tom Clark,48000,40000,3
2023-04-05,RAV4,Toyota,West,Lisa Ray,34000,29000,9
`;

export const DEFAULT_WIDGETS: WidgetConfig[] = []; // Starts empty until data is loaded