import { DecimalPipe } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapServices } from '../map-services';
import { MapVisualitionUrl } from '../map-visualition-url';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  imports: [DecimalPipe,FormsModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit{

  // --- Data & State Variables ---
  maps: any[] = [];
  searchText: string = ''; // Bound to the search input

  // Mock data structure for the user's maps
  // Note: 'tags' are used for extra search filter possibilities
  mockMaps = [
    { id: 101, name: 'College Campus', description: 'A challenging 12km hike with scenic views.', views: 350, tags: ['Hike', 'Challenging', 'Mountain'], jsonUrl: 'https://res.cloudinary.com/dezwo04ym/raw/upload/v1764950417/campus_full_walk_nhb8rq.json',mapUrl: 'https://res.cloudinary.com/dezwo04ym/raw/upload/v1764500503/rqp0jja3obhnqpizz1qq.gpx'},
    { id: 102, name: 'Downtown Bike Lanes', description: 'Optimized route for city commuting and sightseeing.', views: 1200, tags: ['Bike', 'City', 'Commute'], jsonUrl: '',mapUrl:'' },
    { id: 103, name: 'Historical Walking Tour', description: 'Points of interest across the old district.', views: 98, tags: ['Walk', 'History', 'City'], jsonUrl: 'map-icon-walk.svg',mapUrl:'' },
    { id: 104, name: 'Coastal Scenic Drive', description: 'A popular driving route along the Pacific coast.', views: 890, tags: ['Drive', 'Scenic', 'Coastal'], jsonUrl: 'map-icon-drive.svg',mapUrl:'' },
    { id: 105, name: 'River Kayak Tour', description: 'Paddlesport route from Miller Dam to Portville.', views: 45, tags: ['Water', 'Kayak', 'River'], jsonUrl: 'map-icon-kayak.svg',mapUrl:'' },
    { id: 106, name: 'Central Park Jogging Path', description: 'A flat, 5km loop ideal for runners.', views: 210, tags: ['Run', 'Park', 'Easy'], jsonUrl: 'map-icon-run.svg',mapUrl:'' },
    { id: 107, name: 'Coastal Scenic Drive', description: 'A popular driving route along the Pacific coast.', views: 890, tags: ['Drive', 'Scenic', 'Coastal'], jsonUrl: 'map-icon-drive.svg',mapUrl:'' },
    { id: 108, name: 'River Kayak Tour', description: 'Paddlesport route from Miller Dam to Portville.', views: 45, tags: ['Water', 'Kayak', 'River'], jsonUrl: 'map-icon-kayak.svg',mapUrl:'' },
    { id: 109, name: 'Central Park Jogging Path', description: 'A flat, 5km loop ideal for runners.', views: 210, tags: ['Run', 'Park', 'Easy'], jsonUrl: 'map-icon-run.svg',mapUrl:'' },
  ];

  constructor(private mapservice:MapServices,private passingUrl:MapVisualitionUrl,private route:Router) {}

  ngOnInit() {
    this.maps = this.mockMaps;
  }

  // --- Search and Filtering Logic ---
  getFilteredMaps(): any[] {
    if (!this.searchText) {
      return this.maps; // Show all maps if no search text
    }
    const searchLower = this.searchText.toLowerCase();
    
    // Filter maps based on name, description, or tags
    return this.maps.filter(map => 
      map.name.toLowerCase().includes(searchLower) ||
      map.description.toLowerCase().includes(searchLower) ||
      map.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  }

  // Placeholder for map action
  viewMap(mapUrl:string,mapName:string) {
    // this.passingUrl.AssignUrl(mapUrl);
    this.route.navigate(['/viewmap'],{queryParams:{mapname:mapName,mapurl:mapUrl}})

  }

  OnDownload(url:string,name:string){
      if (!url) {
        alert('No file URL found for this map.');
        return;
      }
      this.mapservice.OnDownloadMap(url, name);
    }
}
