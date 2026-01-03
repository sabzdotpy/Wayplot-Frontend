import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapServices } from '../map-services';
import { MapVisualitionUrl } from '../map-visualition-url';
import { Router } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-dashboard',
  imports: [DecimalPipe, FormsModule, ToastrModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  // --- Data & State Variables ---
  maps: any[] = [];
  searchText: string = ''; // Bound to the search input

  // Mock data structure for the user's maps
  // Note: 'tags' are used for extra search filter possibilities
  // mockMaps = [
  //   {
  //     id: 100,
  //     name: 'Kalasalingam Campus Map v2',
  //     description:
  //       'Live walking map of kalasalingam university v2, More routes and shortcuts. Captured by TrioVerse.',
  //     views: 350,
  //     tags: ['Campus', 'Walk', 'Own'],
  //     jsonUrl:
  //       "https://res.cloudinary.com/dezwo04ym/raw/upload/v1765950443/gpx_graphs/json_graph/KLU_Campus_All_Roads",
  //     mapUrl:
  //       'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765508403/gpx_graphs/raw_gpx/KLU_Campus_All_Roads_42014d5c',
  //   },
  //   {
  //     id: 101,
  //     name: 'Kalasalingam University',
  //     description: 'Live walking map of kalasalingam university. Captured by TrioVerse.',
  //     views: 350,
  //     tags: ['Campus', 'Walk', 'Own'],
  //     jsonUrl:
  //       'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465966/gpx_graphs/json_graph/klu_full_walk',
  //     mapUrl:
  //       'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765465963/gpx_graphs/raw_gpx/klu_full_walk_2684dcf9',
  //   },
  //   {
  //     id: 102,
  //     name: 'Downtown Bike Lanes',
  //     description: 'Optimized route for city commuting and sightseeing.',
  //     views: 1200,
  //     tags: ['Bike', 'City', 'Commute'],
  //     jsonUrl:
  //       'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765440276/gpx_graphs/campus_routing_graph',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 103,
  //     name: 'Historical Walking Tour',
  //     description: 'Points of interest across the old district.',
  //     views: 98,
  //     tags: ['Walk', 'History', 'City'],
  //     jsonUrl:
  //       'https://res.cloudinary.com/dezwo04ym/raw/upload/v1765440276/gpx_graphs/campus_routing_graph',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 104,
  //     name: 'Coastal Scenic Drive',
  //     description: 'A popular driving route along the Pacific coast.',
  //     views: 890,
  //     tags: ['Drive', 'Scenic', 'Coastal'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 105,
  //     name: 'River Kayak Tour',
  //     description: 'Paddlesport route from Miller Dam to Portville.',
  //     views: 45,
  //     tags: ['Water', 'Kayak', 'River'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 106,
  //     name: 'Central Park Jogging Path',
  //     description: 'A flat, 5km loop ideal for runners.',
  //     views: 210,
  //     tags: ['Run', 'Park', 'Easy'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 107,
  //     name: 'Coastal Scenic Drive',
  //     description: 'A popular driving route along the Pacific coast.',
  //     views: 890,
  //     tags: ['Drive', 'Scenic', 'Coastal'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 108,
  //     name: 'River Kayak Tour',
  //     description: 'Paddlesport route from Miller Dam to Portville.',
  //     views: 45,
  //     tags: ['Water', 'Kayak', 'River'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  //   {
  //     id: 109,
  //     name: 'Central Park Jogging Path',
  //     description: 'A flat, 5km loop ideal for runners.',
  //     views: 210,
  //     tags: ['Run', 'Park', 'Easy'],
  //     jsonUrl: '',
  //     mapUrl: '',
  //   },
  // ];

  constructor(
    private mapService: MapServices,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.mapService.listAllMaps().subscribe((maps: any) => {
      let flattenedMaps = maps.data.map((mapObj: any) => {
        return {
          ...mapObj.map,
          views: mapObj.viewCount,
          downloads: mapObj.downloadCount,
        }
      });
      this.maps = flattenedMaps;
    });
    if (!localStorage.getItem('token')) {
      this.toastr.error('No token found. Please sign in.', 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
      this.router.navigate(['/signin']);
    }
  }

  // --- Search and Filtering Logic ---
  // Change this in your .ts file
get filteredMaps(): any[] {
  if (!this.searchText) return this.maps;
  const search = this.searchText.toLowerCase();
  return this.maps.filter(m => 
    (m.name?.toLowerCase().includes(search)) || 
    (m.description?.toLowerCase().includes(search))
  );
}

  // Placeholder for map action
  viewMap(mapUrl: string, mapName: string) {
    if (!mapUrl) {
      alert("Sorry, Map url doesn't exist!");
      return;
    }
    this.router.navigate(['/viewmap'], { queryParams: { mapname: mapName, mapurl: mapUrl } });
  }

  OnDownload(id: string, gpx_url: string, json_url: string, fileName: string) {
    if (!gpx_url||!json_url) {
      alert('No file URL found for this map.');
      return;
    }
    this.mapService.OnDownloadMapFiles(id, gpx_url, json_url, fileName);
  }

  async signOut() {
    this.toastr.info('Signing you out...', 'Info', {
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      easeTime: 400,
      toastClass: 'ngx-toastr slide-in',
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    localStorage.clear();
    this.router.navigate(['/signin']);
  }
}
