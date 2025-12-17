import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
interface ChartData {
  name: string;
  value: number;
}
interface SeriesData {
  name: string;
  series: ChartData[];
}

@Component({
  selector: 'app-analysis-dashboard',
  imports: [NgxChartsModule,RouterModule],
  templateUrl: './analysis-dashboard.html',
  styleUrl: './analysis-dashboard.css',
})

export class AnalyticsDashboard implements OnInit {
  // --- Chart Configuration ---

// responsiveView: [number, number] | null = [700, 400];
  colorScheme: any = { 
    name: 'customScheme', // ngx-charts often requires a name property
    selectable: true,
    group: 'ordinal', 
    domain: ['#8c26de', '#3f51b5', '#4caf50', '#ff9800', '#f44336']
  };
  colorrScheme: any = { 
    name: 'customScheme', 
    selectable: true,
    group: 'ordinal', 
    domain: ['#f44336']
  };

  
  // 1. User Growth and Activity (Line Chart)
 userGrowthData: SeriesData[] = [
  {
    name: 'New Registrations',
    series: [
      { name: 'Jan', value: 120 },
      { name: 'Feb', value: 150 },
      { name: 'Mar', value: 180 },
      { name: 'Apr', value: 135 },
      { name: 'May', value: 210 },
      { name: 'Jun', value: 250 },
      { name: 'Jul', value: 275 }, // Added
      { name: 'Aug', value: 290 }, // Added
      { name: 'Sep', value: 260 }, // Added
      { name: 'Oct', value: 310 }, // Added
      { name: 'Nov', value: 330 }, // Added
      { name: 'Dec', value: 350 }  // Added
    ]
  },
  {
    name: 'Active Users',
    series: [
      { name: 'Jan', value: 450 },
      { name: 'Feb', value: 500 },
      { name: 'Mar', value: 620 },
      { name: 'Apr', value: 650 },
      { name: 'May', value: 700 },
      { name: 'Jun', value: 780 },
      { name: 'Jul', value: 810 }, // Added
      { name: 'Aug', value: 850 }, // Added
      { name: 'Sep', value: 830 }, // Added
      { name: 'Oct', value: 900 }, // Added
      { name: 'Nov', value: 950 }, // Added
      { name: 'Dec', value: 1020 } // Added
    ]
  }
];

  // 2. Monthly Map Generation Count (Vertical Bar Chart)
  mapGenerationData: ChartData[] = [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 9100 },
    { name: 'Mar', value: 12300 },
    { name: 'Apr', value: 10500 },
    { name: 'May', value: 14500 },
    { name: 'Jun', value: 16200 },
    { name: 'Jul', value: 18000 },
    { name: 'Aug', value: 19500 },
    { name: 'Sep', value: 21000 },
    { name: 'Oct', value: 22500 },
    { name: 'Nov', value: 24000 },
    { name: 'Dec', value: 25500 },

  ];

  // 3. Downloads vs. Views/Interactions (Area Chart)
  downloadsVsViewsData: SeriesData[] = [
    {
      name: 'Total Views',
      series: [
        { name: 'Jan', value: 25000 }, { name: 'Feb', value: 30000 }, { name: 'Mar', value: 35000 },
        { name: 'Apr', value: 32000 }, { name: 'May', value: 40000 }, { name: 'Jun', value: 45000 },
        { name: 'Jul', value: 50000 }, { name: 'Aug', value: 55000 }, { name: 'Sep', value: 60000 },
        { name: 'Oct', value: 65000 }, { name: 'Nov', value: 70000 }, { name: 'Dec', value: 75000 }
      ]
    },
    {
      name: 'Downloads',
      series: [
        { name: 'Jan', value: 2500 }, { name: 'Feb', value: 3100 }, { name: 'Mar', value: 3900 },
        { name: 'Apr', value: 3500 }, { name: 'May', value: 5000 }, { name: 'Jun', value: 5500 },
        { name: 'Jul', value: 6000 }, { name: 'Aug', value: 6500 }, { name: 'Sep', value: 7000 },
        { name: 'Oct', value: 7500 }, { name: 'Nov', value: 8000 }, { name: 'Dec', value: 8500 }
      ]
    }
  ];

  // 4. User Role Distribution (Donut Chart)
  roleDistributionData: ChartData[] = [
    { name: 'SuperAdmin', value: 20 },
    { name: 'Admin', value: 35 },
    { name: 'Regular', value: 840 }
  ];

  constructor() { }

  ngOnInit(): void {
    // Initialization logic, if any.
  }
  

}
