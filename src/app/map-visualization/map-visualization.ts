import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { MapVisualitionUrl } from '../map-visualition-url';
import { ActivatedRoute } from '@angular/router';
interface Node {
    id: number;
    lat: number;
    lon: number;
}
interface Edge {
    u: number;
    v: number;
    weight: number;
}
interface Graph {
    nodes: Node[];
    edges: Edge[];
    bounds: [number, number][];
}

@Component({
  selector: 'app-map-visualization',
  imports: [FormsModule],
  templateUrl: './map-visualization.html',
  styleUrl: './map-visualization.css',
})
export class MapVisualization implements OnInit, AfterViewInit, OnDestroy {
  // --- CONFIGURATION ---
  // private readonly CLOUDINARY_JSON_URL = 'https://res.cloudinary.com/dezwo04ym/raw/upload/v1764950417/campus_full_walk_nhb8rq.json';
    private CLOUDINARY_JSON_URL='';
  // --- ANGULAR STATE (New and Existing) ---
  statusMessage: string = 'Initializing...';
  mapName:string='';
  
  // New UI Properties for Route Planning
  navigationMode: string = 'shortest'; // Bound to radio buttons
  startLocationText: string = '';       // Bound to 'From' input
  endLocationText: string = '';         // Bound to 'To' input
  
  // --- LEAFLET/GRAPH STATE ---
  private map!: L.Map;
  private graphData!: Graph;
  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;
  private pathPolyline: L.Polyline | null = null;
  private watchId: number | null = null;
  
  // CRITICAL: Stores the ID (index) of the nearest node
  startNodeId: number | null = null; 
  endNodeId: number | null = null;   


  private startIcon = L.icon({
    iconUrl: 'assets/red.png', // Change this URL to your blue/start marker image
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
 
// New Icon for END Point (e.g., Red for 'To')
private endIcon = L.icon({
    iconUrl: 'assets/green.png', // Change this URL to your red/end marker image
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// New Icon for LIVE TRACKING (Blue Dot)
private trackingIcon = L.icon({
    iconUrl: 'assets/userLoc.png', // You need to provide this image
    shadowUrl: 'assets/marker-shadow.png', // No shadow needed for a simple dot
    iconSize: [16, 16],
    iconAnchor: [8, 8], // Center the icon visually
    popupAnchor: [0, 0],
    shadowSize: [0, 0]
});
  
  // --- CONSTRUCTOR & LIFECYCLE HOOKS ---
  constructor(private http: HttpClient, private cd: ChangeDetectorRef,private route:ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
          const mapUrl = params['mapurl'];
          const mName=params['mapname']
          
          if (mapUrl) {
              // 2. Check if the URL is different to prevent redundant loading
              if (this.CLOUDINARY_JSON_URL !== mapUrl) {
                  this.CLOUDINARY_JSON_URL = mapUrl;
                  this.mapName=mName;
                  
                  // Clear map layers before drawing the new map
                  this.resetMap(); 
                  
                  // Load the new map data
                  this.loadGraphData(); 
              }
          }else{
            alert("Sorry,Map url doesn't exist !");
          }
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
  
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    //Stop the location watcher when the component is destroyed
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
  }
  }
  
  // --- MAP INITIALIZATION & DATA LOADING ---
  
  private initMap(): void {
    // Initial view is set, but will be overridden by fitBounds() later
    this.map = L.map('map').setView([16.4952, 80.6277], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    
    // Attach map click event handler
    this.map.on('click', this.onMapClick.bind(this));
  }
  
  private loadGraphData(): void {
    this.http.get<Graph>(this.CLOUDINARY_JSON_URL).subscribe({
      next: (data) => {
        this.graphData = data;
        this.statusMessage = 'Graph data loaded. Click map to set <b>Start</b>.';
        this.drawInitialEdges();
        this.cd.detectChanges(); // Force UI update after async call
      },
      error: (err) => {
        console.error('Failed to load graph data:', err);
        this.statusMessage = 'Error loading JSON. Check console for details.';
        this.cd.detectChanges();
      }
    });
  }

  // --- DRAWING AND INTERACTION ---

  private drawInitialEdges(): void {
    const edgeCoords: L.LatLngExpression[][] = []; 

    this.graphData.edges.forEach(edge => { 
        const node1 = this.graphData.nodes[edge.u]; 
        const node2 = this.graphData.nodes[edge.v];

        if (node1 && node2) {
            edgeCoords.push([
                [node1.lat, node1.lon], 
                [node2.lat, node2.lon]
            ]);
        }
    });
    
    // Draw the network
    L.polyline(edgeCoords, { color: '#888', weight: 2, opacity: 0.4 }).addTo(this.map);
    
    // Update status and fit bounds
    this.statusMessage = "Ready. Click map to set <b>Start</b>.";
    this.map.fitBounds([
        [this.graphData.bounds[0][0], this.graphData.bounds[0][1]], 
        [this.graphData.bounds[1][0], this.graphData.bounds[1][1]]
    ]);
  }
  
  // --- Map Click Handler ---

  private onMapClick(e: L.LeafletMouseEvent): void {
    if (!this.graphData) {
        this.statusMessage = 'Data not yet loaded.';
        this.cd.detectChanges();
        return;
    }

    const nearestNodeId = this.findNearestNode(e.latlng.lat, e.latlng.lng);
    const nearestNode = this.graphData.nodes[nearestNodeId];
    
    // 1. VALIDATION CHECK: Distance from click to nearest graph node
    const distanceToNode = this.calculateDistance(e.latlng.lat, e.latlng.lng, nearestNode.lat, nearestNode.lon);
    const MAX_DISTANCE_M = 1000; 

    if (distanceToNode > MAX_DISTANCE_M) {
        this.statusMessage = '🔴 Alert: The selected location is too far from the campus roads. Please click a point *inside* the campus.';
        this.cd.detectChanges();
        return; // Block setting End point if the click is outside the map area
    }

    const markerLatLon: L.LatLngExpression = [nearestNode.lat, nearestNode.lon];

    // --- Core Logic Flow ---

    // 1. SET END POINT (Highest priority, if a Start point is already defined)
    if (this.startNodeId !== null && this.endNodeId === null) {
        // This block is reached if Start is set (either by tracking or manually)
        
        // Set End (This point passed the distance check)
        if (this.endMarker) this.map.removeLayer(this.endMarker);
        this.endNodeId = nearestNodeId;
        this.endMarker = L.marker(markerLatLon, { title: 'End', icon: this.endIcon }).addTo(this.map);
        
        this.endLocationText = `${nearestNode.lat.toFixed(5)}, ${nearestNode.lon.toFixed(5)}`;
        this.statusMessage = 'End set. Press <b>Calculate Route</b>.';
        
    } 
    // 2. SET MANUAL START POINT (Only runs if NO Start point is set AND tracking is OFF)
    else if (this.startNodeId === null) {
        
        if (this.watchId !== null) {
            // User is trying to set START manually, but tracking is ON.
            this.statusMessage = 'Please click "Clear Route" to stop tracking before setting a manual Start point.';
            this.cd.detectChanges();
            return; 
        }

        // Set Start (Manual Pin) - Only reached if watchId is null
        if (this.startMarker) this.map.removeLayer(this.startMarker);
        this.startNodeId = nearestNodeId;
        this.startMarker = L.marker(markerLatLon, { title: 'Start', icon: this.startIcon }).addTo(this.map);
        
        this.startLocationText = `${nearestNode.lat.toFixed(5)}, ${nearestNode.lon.toFixed(5)}`;
        this.statusMessage = 'Start set. Click again to set <b>End</b>.';
    }
    
    this.cd.detectChanges();
}
  
  public resetMap(): void {
    this.stopTracking();
    // Clear Markers and Path
    if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
    if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }
    if (this.pathPolyline) { this.map.removeLayer(this.pathPolyline); this.pathPolyline = null; }
    
    // Clear State
    this.startNodeId = null; 
    this.endNodeId = null; 
    this.startLocationText = '';
    this.endLocationText = '';
    
    this.statusMessage = 'Map reset. Click map to set <b>Start</b>.';
    this.cd.detectChanges();
  }

  private findNearestNode(lat: number, lon: number): number {
    let closestId = -1;
    let minDistanceSq = Infinity;

    for (let i = 0; i < this.graphData.nodes.length; i++) {
        const node = this.graphData.nodes[i];
        const distSq = (node.lat - lat) ** 2 + (node.lon - lon) ** 2;  //Euclidean distance

        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestId = i;
        }
    }
    return closestId;
  }
  
//validation check
private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Uses a simplified Haversine formula for rough distance in meters
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δλ/2) * Math.sin(Δλ/2) * Math.cos(φ1) * Math.cos(φ2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}
  
  // --- NEW FUNCTIONALITY ---

public fetchCurrentLocation(): void {
    if (!this.graphData) {
        this.statusMessage = 'Data not yet loaded.';
        this.cd.detectChanges();
        return;
    }

    if (this.watchId !== null) {
        // Already tracking, do nothing or show a message
        this.statusMessage = 'Currently tracking movement.';
        this.cd.detectChanges();
        return;
    }

    this.statusMessage = 'Starting continuous location tracking...';
    
    if (navigator.geolocation) {
        // Start watching the position, which calls updateLocation on every fix
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.updateLocation(position),
            (error) => this.handleLocationError(error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        this.statusMessage = 'Geolocation is not supported by your browser.';
        this.cd.detectChanges();
    }
}
  
private updateLocation(position: GeolocationPosition): void {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const markerLatLon: L.LatLngExpression = [lat, lon];
    
    // 1. Find nearest graph node for validation
    const nearestNodeId = this.findNearestNode(lat, lon);
    const nearestNode = this.graphData.nodes[nearestNodeId];

    // --- VALIDATION CHECK: Distance from GPS to nearest graph node ---
    const distanceToNode = this.calculateDistance(lat, lon, nearestNode.lat, nearestNode.lon);
    const MAX_DISTANCE_M = 1000; // 1 km tolerance

    if (distanceToNode > MAX_DISTANCE_M) {
        // --- REQUIREMENT 1: LOCATION IS TOO FAR (STOP TRACKING) ---
        
        // Show the required alert
        this.statusMessage = '🔴 Alert: Your current location is far away from the mapped area. Tracking stopped.';
        
        // Stop the watcher and clear all state (Start/End markers and IDs)
        if (this.watchId !== null) { 
            this.stopTracking(); // Clears watchId
            this.resetMap();     // Clears markers and IDs
        }
        
        // Re-set the specific alert message after resetMap clears the status
        this.statusMessage = '🔴 Alert: Your current location is far away from the mapped area. Tracking stopped.';
        this.cd.detectChanges();
        
        return; // CRITICAL: Stop execution here. Do not set startNodeId or marker.
    }
    
    // --- REQUIREMENT 2: LOCATION IS NEAR (ENABLE REAL-TIME TRACKING) ---

    // 2. Set/Update Marker
    if (!this.startMarker) {
        // Initial setup of the marker
        this.startMarker = L.marker(markerLatLon, { title: 'Live Location', icon: this.trackingIcon }).addTo(this.map);
        // Center the map on the user's valid location
        this.map.flyTo(markerLatLon, 16); 
    } else {
        // Update marker position on subsequent movements
        this.startMarker.setLatLng(markerLatLon);
        if (this.startMarker.options.icon !== this.trackingIcon) {
            this.startMarker.setIcon(this.trackingIcon);
        }
    }
    
    // 3. Update State for Routing and UI
    this.startNodeId = nearestNodeId; // This is the ID of the node on the graph
    this.startLocationText = `${lat.toFixed(5)}, ${lon.toFixed(5)} (Tracking)`;

    // 4. Update status and trigger Angular change detection
    if (this.endNodeId === null) {
        this.statusMessage = 'Tracking active. Click map to set <b>End</b>.';
    } else {
        this.statusMessage = 'Tracking active. Press <b>Calculate Route</b>.';
    }
    this.cd.detectChanges();
}

private handleLocationError(error: GeolocationPositionError): void {
    this.statusMessage = `Error tracking location: ${error.message}`;
    this.cd.detectChanges();
    this.stopTracking();
}
  
  public stopTracking(): void {
    if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
    }
}

  public calculateRoute(): void {
    if (this.startNodeId === null || this.endNodeId === null) {
      this.statusMessage = 'Please set both Start and End points.';
      return;
    }

    this.statusMessage = `Calculating ${this.navigationMode} path...`;
    
    // Dispatch to the correct algorithm based on selection
    switch (this.navigationMode) {
      case 'shortest':
        this.runShortestPath(this.startNodeId, this.endNodeId);
        break;
      case 'energy_efficient':
        this.runEnergyEfficientPath(this.startNodeId, this.endNodeId);
        break;
      case 'least_turn':
        this.runLeastTurnPath(this.startNodeId, this.endNodeId);
        break;
      default:
        this.runShortestPath(this.startNodeId, this.endNodeId); // Fallback
    }
  }

  // --- ROUTING DISPATCHER METHODS ---

  private runShortestPath(startId: number, endId: number): void {
    // This calls the existing Dijkstra logic
    this.runDijkstra(startId, endId);
  }

  private runEnergyEfficientPath(startId: number, endId: number): void {
    // Method for future algorithm implementation (e.g., A* considering elevation/slope)
    this.statusMessage = 'Energy Efficient Path calculation logic is a placeholder.';
    this.cd.detectChanges();
  }

  private runLeastTurnPath(startId: number, endId: number): void {
    // Method for future algorithm implementation (e.g., A* factoring in turns)
    this.statusMessage = 'Least Turn Path calculation logic is a placeholder.';
    this.cd.detectChanges();
  }

  // --- DIJKSTRA'S ALGORITHM (Renamed from calculatePath) ---

  private runDijkstra(startNodeId: number, endNodeId: number): void {
    
    const startNodeString = startNodeId.toString();
    const endNodeString = endNodeId.toString();

    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const pq = new PriorityQueue();

    // 1. Initialize Adjacency List and Data Structures
    const adjacencyList: { [key: string]: [string, number][] } = {};
    
    for (const node of this.graphData.nodes) {
        const nodeIdString = node.id.toString(); 
        adjacencyList[nodeIdString] = []; 
        distances[nodeIdString] = Infinity;
        previous[nodeIdString] = null;
    }
    
    distances[startNodeString] = 0;
    pq.enqueue(startNodeString, 0); 

    // 2. Build Adjacency List
    this.graphData.edges.forEach((edge) => {
        const id1 = edge.u.toString();
        const id2 = edge.v.toString();
        const dist = edge.weight;

        // Check if node IDs exist in the initialized list (safety check)
        if (adjacencyList[id1]) {
            adjacencyList[id1].push([id2, dist]);
        }
        if (adjacencyList[id2]) {
            adjacencyList[id2].push([id1, dist]); 
        }
    });

    // 3. Main Algorithm Loop
    while (!pq.isEmpty()) {
        const { element: current } = pq.dequeue(); 

        if (current === endNodeString) break; 
        
        if (distances[current] > distances[endNodeString]) continue;

        if (adjacencyList[current]) { 
            adjacencyList[current].forEach(edge => {
                const neighbor = edge[0]; 
                const weight = edge[1];
                
                const alt = distances[current] + weight;
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = current;
                    pq.enqueue(neighbor, alt);
                }
            });
        }
    }
    
    this.reconstructPath(previous, distances[endNodeString], endNodeId);
  }
  
  private reconstructPath(previous: { [key: string]: string | null }, totalDist: number, endNodeId: number): void {
    const endNodeString = endNodeId.toString();
    
    // Check for "No path found"
    if (previous[endNodeString] === null && this.startNodeId !== endNodeId) { 
        this.statusMessage = "No path found (Roads not connected?)";
        this.cd.detectChanges();
        return;
    }
    
    const path = [];
    let curr: string | null = endNodeString;
    while (curr !== null) {
        path.push(curr);
        curr = previous[curr];
    }
    path.reverse();

    // Draw Path
    const latlngs = path.map(id => {
        const index = parseInt(id, 10);
        const n = this.graphData.nodes[index];
        return [n.lat, n.lon];
    });

    if (this.pathPolyline) this.map.removeLayer(this.pathPolyline);
    // Cast to L.LatLngExpression[] to satisfy Leaflet types for the path segments
    this.pathPolyline = L.polyline(latlngs as L.LatLngExpression[], { color: 'blue', weight: 5 }).addTo(this.map);
    
    // Zoom to fit the new path bounds
    this.map.fitBounds(this.pathPolyline.getBounds());
    
    // Set final distance status
    this.statusMessage = `<b>Path Found!</b><br>Mode: ${this.navigationMode} | Distance: ${Math.round(totalDist)} meters`;
    this.cd.detectChanges(); // Final UI update
  }
}

// --- UTILITY: SIMPLE PRIORITY QUEUE (Keep this class definition) ---
class PriorityQueue {
    private items: { element: string, priority: number }[] = [];

    enqueue(element: string, priority: number): void {
        const qElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                this.items.splice(i, 0, qElement);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(qElement);
        }
    }

    dequeue(): { element: string, priority: number } {
        return this.items.shift()!;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

}
