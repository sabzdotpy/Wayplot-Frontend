import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
// import { MapVisualitionUrl } from '../map-visualition-url'; // Assuming this import is correct
import { ActivatedRoute } from '@angular/router';

// --- INTERFACE DEFINITIONS ---
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
  standalone: true, // Assuming this is a standalone component
  imports: [FormsModule],
  templateUrl: './map-visualization.html',
  styleUrl: './map-visualization.css',
})
export class MapVisualization implements OnInit, AfterViewInit, OnDestroy {
  // --- CONFIGURATION & CONSTANTS ---
  private CLOUDINARY_JSON_URL = '';
  
  // ENERGY EFFICIENT CONSTANTS
  private readonly ENERGY_PENALTY_FACTOR = 1.2; 
  
  // LEAST TURN CONSTANTS
  private readonly TURN_PENALTY = 50; // Distance penalty in meters
  private readonly SHARP_TURN_THRESHOLD_DEG = 150; // Angle threshold
  
  // --- ANGULAR STATE ---
  statusMessage: string = 'Initializing...';
  mapName: string = '';

  private scanLayers: L.Polyline[] = []; 
  
  navigationMode: string = 'shortest'; 
  startLocationText: string = ''; 
  endLocationText: string = ''; 
  
  // --- LEAFLET/GRAPH STATE ---
  private map!: L.Map;
  private graphData!: Graph;
  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;
  private pathPolyline: L.Polyline | null = null;
  private watchId: number | null = null;
  
  startNodeId: number | null = null; 
  endNodeId: number | null = null;   

  // --- ICONS ---
  private startIcon = L.icon({
      iconUrl: 'assets/red.png', 
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
  
  private endIcon = L.icon({
      iconUrl: 'assets/green.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  private trackingIcon = L.icon({
      iconUrl: 'assets/userLoc.png', 
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, 0], shadowSize: [0, 0]
  });
  
  // --- CONSTRUCTOR & LIFECYCLE HOOKS ---
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
          const mapUrl = params['mapurl'];
          const mName = params['mapname'];
          
          if (mapUrl) {
              if (this.CLOUDINARY_JSON_URL !== mapUrl) {
                  this.CLOUDINARY_JSON_URL = mapUrl;
                  this.mapName = mName;
                  
                  this.resetMap(); 
                  
                  this.loadGraphData(); 
              }
          } else {
            alert("Sorry,Map url doesn't exist !");
          }
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
  
  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); }
    if (this.watchId !== null) { navigator.geolocation.clearWatch(this.watchId); }
  }
  
  // --- MAP INITIALIZATION & DATA LOADING (UNCHANGED) ---
  
  private initMap(): void {
    this.map = L.map('map').setView([16.4952, 80.6277], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.map.on('click', this.onMapClick.bind(this));
  }
  
  private loadGraphData(): void {
    this.http.get<Graph>(this.CLOUDINARY_JSON_URL).subscribe({
      next: (data) => {
        this.graphData = data;
        this.statusMessage = 'Graph data loaded. Click map to set <b>Start</b>.';
        this.drawInitialEdges();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load graph data:', err);
        this.statusMessage = 'Error loading JSON. Check console for details.';
        this.cd.detectChanges();
      }
    });
  }

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
    
    L.polyline(edgeCoords, { color: '#888', weight: 2, opacity: 0.4 }).addTo(this.map);
    
    this.statusMessage = "Ready. Click map to set <b>Start</b>.";
    this.map.fitBounds([
        [this.graphData.bounds[0][0], this.graphData.bounds[0][1]], 
        [this.graphData.bounds[1][0], this.graphData.bounds[1][1]]
    ]);
  }
  
  // --- MAP CLICK HANDLER (UNCHANGED) ---

  private onMapClick(e: L.LeafletMouseEvent): void {
    if (!this.graphData) { this.statusMessage = 'Data not yet loaded.'; this.cd.detectChanges(); return; }
    const nearestNodeId = this.findNearestNode(e.latlng.lat, e.latlng.lng);
    const nearestNode = this.graphData.nodes[nearestNodeId];
    
    const distanceToNode = this.calculateDistance(e.latlng.lat, e.latlng.lng, nearestNode.lat, nearestNode.lon);
    const MAX_DISTANCE_M = 1000; 

    if (distanceToNode > MAX_DISTANCE_M) {
        this.statusMessage = '🔴 Alert: The selected location is too far from the campus roads. Please click a point *inside* the campus.';
        this.cd.detectChanges();
        return;
    }

    const markerLatLon: L.LatLngExpression = [nearestNode.lat, nearestNode.lon];

    if (this.startNodeId !== null && this.endNodeId === null) {
        if (this.endMarker) this.map.removeLayer(this.endMarker);
        this.endNodeId = nearestNodeId;
        this.endMarker = L.marker(markerLatLon, { title: 'End', icon: this.endIcon }).addTo(this.map);
        this.endLocationText = `${nearestNode.lat.toFixed(5)}, ${nearestNode.lon.toFixed(5)}`;
        this.statusMessage = 'Ready. Press <b>Calculate Route</b>.';
    } 
    else if (this.startNodeId === null) {
        if (this.watchId !== null) {
            this.statusMessage = 'Please click "Clear Route" to stop tracking before setting a manual Start point.';
            this.cd.detectChanges();
            return; 
        }
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
    if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
    if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }
    if (this.pathPolyline) { this.map.removeLayer(this.pathPolyline); this.pathPolyline = null; }
    
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
        const distSq = (node.lat - lat) ** 2 + (node.lon - lon) ** 2;
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestId = i;
        }
    }
    return closestId;
  }
  
  // Haversine Distance (Used for Edge Weight calculation and Heuristic)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δλ/2) * Math.sin(Δλ/2) * Math.cos(φ1) * Math.cos(φ2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
  
  // --- GEOLOCATION AND TRACKING (UNCHANGED) ---
  
  public fetchCurrentLocation(): void {
    if (!this.graphData) { this.statusMessage = 'Data not yet loaded.'; this.cd.detectChanges(); return; }
    if (this.watchId !== null) { this.statusMessage = 'Currently tracking movement.'; this.cd.detectChanges(); return; }
    this.statusMessage = 'Starting continuous location tracking...';
    
    if (navigator.geolocation) {
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
    
    const nearestNodeId = this.findNearestNode(lat, lon);
    const nearestNode = this.graphData.nodes[nearestNodeId];

    const distanceToNode = this.calculateDistance(lat, lon, nearestNode.lat, nearestNode.lon);
    const MAX_DISTANCE_M = 1000; 

    if (distanceToNode > MAX_DISTANCE_M) {
        this.statusMessage = '🔴 Alert: Your current location is far away from the mapped area. Tracking stopped.';
        if (this.watchId !== null) { this.stopTracking(); this.resetMap(); }
        this.statusMessage = '🔴 Alert: Your current location is far away from the mapped area. Tracking stopped.';
        this.cd.detectChanges();
        return;
    }
    
    if (!this.startMarker) {
        this.startMarker = L.marker(markerLatLon, { title: 'Live Location', icon: this.trackingIcon }).addTo(this.map);
        this.map.flyTo(markerLatLon, 16); 
    } else {
        this.startMarker.setLatLng(markerLatLon);
        if (this.startMarker.options.icon !== this.trackingIcon) {
            this.startMarker.setIcon(this.trackingIcon);
        }
    }
    
    this.startNodeId = nearestNodeId;
    this.startLocationText = `${lat.toFixed(5)}, ${lon.toFixed(5)} (Tracking)`;

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

    this.statusMessage = 'Beginning path calculation...';
    this.animateScanningEffect(this.startNodeId);

    setTimeout(() => {
        this.statusMessage = `Calculating ${this.navigationMode} path...`;
        
        // Dispatch based on navigation mode
        switch (this.navigationMode) {
            case 'shortest':
                this.runAStarShortestPath(this.startNodeId!, this.endNodeId!);
                break;
            case 'energy_efficient':
                this.runAStarEnergy(this.startNodeId!, this.endNodeId!);
                break;
            case 'least_turn':
                this.runAStarLeastTurn(this.startNodeId!, this.endNodeId!);
                break;
            default:
                this.runAStarShortestPath(this.startNodeId!, this.endNodeId!);
        }
    }, 1500);
  }

  // --- ROUTING DISPATCHER METHODS ---

  private runShortestPath(startId: number, endId: number): void {
    this.runAStarShortestPath(startId, endId);
  }

  // --------------------------------------------------------------------------
  // 1. A* FOR SHORTEST PATH (Based on Distance)
  // --------------------------------------------------------------------------
  
  private heuristicShortestPath(nodeId: number, goalId: number): number {
      if (!this.graphData) return 0;
      const node = this.graphData.nodes[nodeId];
      const goal = this.graphData.nodes[goalId];
      return this.calculateDistance(node.lat, node.lon, goal.lat, goal.lon);
  }

  private runAStarShortestPath(startNodeId: number, endNodeId: number): void {
    
    const startNodeString = startNodeId.toString();
    const endNodeString = endNodeId.toString();

    const g_score: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const pq = new PriorityQueue();

    const adjacencyList: { [key: string]: [string, number][] } = {};
    
    for (const node of this.graphData.nodes) {
        const nodeIdString = node.id.toString(); 
        adjacencyList[nodeIdString] = []; 
        g_score[nodeIdString] = Infinity;
        previous[nodeIdString] = null;
    }
    
    this.graphData.edges.forEach((edge) => {
        const id1 = edge.u.toString();
        const id2 = edge.v.toString();
        const dist = edge.weight;
        if (adjacencyList[id1]) { adjacencyList[id1].push([id2, dist]); }
        if (adjacencyList[id2]) { adjacencyList[id2].push([id1, dist]); }
    });

    g_score[startNodeString] = 0;
    const h_start = this.heuristicShortestPath(startNodeId, endNodeId);
    pq.enqueue(startNodeString, h_start);

    while (!pq.isEmpty()) {
        const { element: current } = pq.dequeue(); 

        if (current === endNodeString) {
            const totalDistance = g_score[endNodeString];
            
            // 1. Reconstruct the path (which also handles animation)
            this.reconstructPath(previous, totalDistance, endNodeId);
            
            // 2. Update Status Message with the distance
            this.statusMessage = `
                <b>Path Found!</b><br>
                Distance: ${Math.round(totalDistance)} meters
            `;
            this.cd.detectChanges(); // Tell Angular to update the view
            return; // Exit the function once the path is found
        }
        
        if (g_score[current] > g_score[endNodeString]) continue;

        if (adjacencyList[current]) { 
            adjacencyList[current].forEach(edge => {
                const neighbor = edge[0]; 
                const weight = edge[1];
                
                const tentative_g = g_score[current] + weight;

                if (tentative_g < g_score[neighbor]) {
                    g_score[neighbor] = tentative_g;
                    previous[neighbor] = current;
                    
                    const neighborId = parseInt(neighbor, 10);
                    const h_neighbor = this.heuristicShortestPath(neighborId, endNodeId);
                    const f_score = tentative_g + h_neighbor;
                    
                    pq.enqueue(neighbor, f_score);
                }
            });
        }
    }
    
    // Fallback if no path is found
    this.statusMessage = "No path found for Shortest Path (A*) routing.";
    this.cd.detectChanges();
  }
  
  // --------------------------------------------------------------------------
  // 2. A* FOR ENERGY EFFICIENT PATH (Based on Energy Cost) - *INTEGRATED*
  // --------------------------------------------------------------------------

  private heuristicEnergyCost(nodeId: number, goalId: number): number {
      const node = this.graphData.nodes[nodeId];
      const goal = this.graphData.nodes[goalId];
      const h_distance = this.calculateDistance(node.lat, node.lon, goal.lat, goal.lon);
      // Heuristic is estimated energy cost
      return h_distance * this.ENERGY_PENALTY_FACTOR;
  }

  private runAStarEnergy(startId: number, endId: number): void {
      
      const startNodeString = startId.toString();
      const endNodeString = endId.toString();

      const came_from: { [key: string]: string | null } = {};
      const g_score: { [key: string]: number } = {}; 
      const distance_score: { [key: string]: number } = {}; 
      
      const pq = new PriorityQueue(); 
      // Adjacency List: [neighbor, energyCost, distance]
      const adjacencyList: { [key: string]: [string, number, number][] } = {}; 
      const nodesCount = this.graphData.nodes.length;
      
      for (let i = 0; i < nodesCount; i++) {
          const nodeIdString = i.toString();
          adjacencyList[nodeIdString] = []; 
          g_score[nodeIdString] = Infinity;
          distance_score[nodeIdString] = Infinity;
          came_from[nodeIdString] = null;
      }
      
      this.graphData.edges.forEach((edge) => {
          const id1 = edge.u.toString();
          const id2 = edge.v.toString();
          const dist = edge.weight;
          
          const energyCost = dist * this.ENERGY_PENALTY_FACTOR;

          if (adjacencyList[id1]) adjacencyList[id1].push([id2, energyCost, dist]);
          if (adjacencyList[id2]) adjacencyList[id2].push([id1, energyCost, dist]); 
      });
      
      g_score[startNodeString] = 0;
      distance_score[startNodeString] = 0;
      
      const h_start = this.heuristicEnergyCost(startId, endId); 
      pq.enqueue(startNodeString, h_start);

      while (!pq.isEmpty()) {
          const { element: current } = pq.dequeue();
          
          if (current === endNodeString) {
              const totalEnergyCost = g_score[endNodeString];
              const totalPhysicalDistance = distance_score[endNodeString];

              this.reconstructPath(came_from, totalEnergyCost, endId); 
              
              this.statusMessage = `
                  <b>Path Found!</b><br>
                  Energy Cost: ${Math.round(totalEnergyCost)} E-units <br>
                  Distance: ${Math.round(totalPhysicalDistance)} meters
              `;
              this.cd.detectChanges();
              return;
          }

          if (g_score[current] > g_score[endNodeString] + 1) continue; 

          if (adjacencyList[current]) {
              adjacencyList[current].forEach(edge => {
                  const neighbor = edge[0]; 
                  const costToNeighbor = edge[1]; 
                  const distanceSegment = edge[2]; 
                  
                  const tentative_g = g_score[current] + costToNeighbor;
                  
                  if (tentative_g < g_score[neighbor]) {
                      came_from[neighbor] = current;
                      g_score[neighbor] = tentative_g;
                      
                      distance_score[neighbor] = distance_score[current] + distanceSegment;

                      const h_neighbor = this.heuristicEnergyCost(parseInt(neighbor, 10), endId);
                      const f_score = tentative_g + h_neighbor;
                      
                      pq.enqueue(neighbor, f_score);
                  }
              });
          }
      }

      this.statusMessage = "No path found for Energy Efficient (A*) routing.";
      this.cd.detectChanges();
  }

  // --------------------------------------------------------------------------
  // 3. A* FOR LEAST TURN PATH (State-Space Search) - *INTEGRATED*
  // --------------------------------------------------------------------------

  /**
   * Calculates the interior angle (in degrees) formed by segments B->A and B->C.
   */
  private calculateTurnAngle(prevId: number, currentId: number, nextId: number): number {
      const coords = (id: number) => {
          const node = this.graphData.nodes[id];
          return [node.lat, node.lon]; 
      };

      const A = coords(prevId);
      const B = coords(currentId);
      const C = coords(nextId);

      // Vector V1 (B -> A)
      const v1 = [A[0] - B[0], A[1] - B[1]];
      // Vector V2 (B -> C)
      const v2 = [C[0] - B[0], C[1] - B[1]];

      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
      const mag2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);

      if (mag1 === 0 || mag2 === 0) {
          return 180; 
      }

      let cosAngle = dot / (mag1 * mag2);
      cosAngle = Math.max(-1, Math.min(1, cosAngle));

      const angleRad = Math.acos(cosAngle);
      return angleRad * (180 / Math.PI); // Return degrees
  }

  private runAStarLeastTurn(startId: number, endId: number): void {
      
      const startNodeString = startId.toString();
      const endNodeString = endId.toString();

      const came_from: { [key: string]: string | null } = {};
      const g_score: { [key: string]: number } = {}; 
      const turn_count: { [key: string]: number } = {};
      
      // We still use the base distance heuristic h for the F-score
      const heuristicDistance = (id: number) => this.calculateDistance(
          this.graphData.nodes[id].lat, this.graphData.nodes[id].lon, 
          this.graphData.nodes[endId].lat, this.graphData.nodes[endId].lon
      );

      const pq = new PriorityQueue(); 
      const adjacencyList: { [key: string]: [string, number][] } = {};
      const nodesCount = this.graphData.nodes.length;

      for (let i = 0; i < nodesCount; i++) {
          const nodeIdString = i.toString();
          adjacencyList[nodeIdString] = []; 
          g_score[nodeIdString] = Infinity;
          turn_count[nodeIdString] = Infinity;
          came_from[nodeIdString] = null;
      }
      
      this.graphData.edges.forEach((edge) => {
          const id1 = edge.u.toString();
          const id2 = edge.v.toString();
          const dist = edge.weight; 

          if (adjacencyList[id1]) adjacencyList[id1].push([id2, dist]);
          if (adjacencyList[id2]) adjacencyList[id2].push([id1, dist]); 
      });
      
      g_score[startNodeString] = 0;
      turn_count[startNodeString] = 0;
      
      const h_start = heuristicDistance(startId);
      
      // Start Element: "currentId,prevId" -> "ID,null"
      const startElement = `${startNodeString},null`; 
      pq.enqueue(startElement, h_start); 

      while (!pq.isEmpty()) {
          
          const { element: encodedElement } = pq.dequeue();
          const [current, prev] = encodedElement.split(',');

          const currentId = parseInt(current, 10);
          const prevId = prev === 'null' ? null : parseInt(prev, 10);
          
          if (current === endNodeString) {
              const totalCost = g_score[endNodeString];
              const totalTurns = turn_count[endNodeString];
              // Subtract penalties to get the actual physical distance
              const totalPhysicalDistance = totalCost - (totalTurns * this.TURN_PENALTY); 
              
              this.reconstructPath(came_from, totalCost, endId);
              
              this.statusMessage = `
                  <b>Path Found!</b><br>
                  Sharp Turns: ${totalTurns} <br>
                  Distance: ${Math.round(totalPhysicalDistance)} meters
              `;
              this.cd.detectChanges();
              return;
          }

          if (adjacencyList[current]) {
              adjacencyList[current].forEach(edge => {
                  const neighbor = edge[0]; 
                  const neighborId = parseInt(neighbor, 10);
                  const distanceSegment = edge[1]; 
                  
                  let tentative_g = g_score[current] + distanceSegment;
                  let newTurnCount = turn_count[current];

                  // Calculate Turn Penalty at the current node (pivot)
                  if (prevId !== null) {
                      const angle = this.calculateTurnAngle(prevId, currentId, neighborId);
                      
                      if (angle < this.SHARP_TURN_THRESHOLD_DEG) {
                          tentative_g += this.TURN_PENALTY;
                          newTurnCount++;
                      }
                  }
                  
                  // This is the CRITICAL change: We must ensure the new path to the *neighbor* // is better than the existing path to the *neighbor*
                  if (tentative_g < g_score[neighbor]) {
                      // Update scores and path
                      came_from[neighbor] = current; // Save the path only by node ID
                      g_score[neighbor] = tentative_g;
                      turn_count[neighbor] = newTurnCount;

                      // Calculate F-Score and ENQUEUE
                      const h_neighbor = heuristicDistance(neighborId);
                      const f_score = tentative_g + h_neighbor;
                      
                      // ENCODE the next element: "neighbor,current"
                      const newElement = `${neighbor},${current}`; 
                      pq.enqueue(newElement, f_score); 
                  }
              });
          }
      }
      
      this.statusMessage = "No path found for Least Turn (A*) routing.";
      this.cd.detectChanges();
  }


  // --- PATH RECONSTRUCTION & ANIMATION (UNCHANGED) ---

  private reconstructPath(previous: { [key: string]: string | null }, totalCostOrDist: number, endNodeId: number): void {
      const endNodeString = endNodeId.toString();
      
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

      const latlngs = path.map(id => {
          const index = parseInt(id, 10);
          const n = this.graphData.nodes[index];
          return [n.lat, n.lon] as [number, number];
      });

      if (this.pathPolyline) this.map.removeLayer(this.pathPolyline);
      
      this.pathPolyline = L.polyline(latlngs as L.LatLngExpression[], { 
          color: 'blue', 
          weight: 5,
          opacity: 0
      }).addTo(this.map);
      
      // Note: Status message is updated inside the specific A* functions now.
      
      this.animatePolylinePath(this.pathPolyline);
  }

  private animatePolylinePath(polyline: L.Polyline): void {
      const pathElement = polyline.getElement() as SVGPathElement | undefined;
      if (!pathElement) {
          polyline.setStyle({ opacity: 1 });
          this.triggerZoom(polyline);
          return;
      }

      const length = pathElement.getTotalLength();
      pathElement.style.strokeDasharray = `${length} ${length}`;
      pathElement.style.strokeDashoffset = `${length}`;

      polyline.setStyle({ opacity: 1 });
      
      pathElement.getBoundingClientRect();

      pathElement.style.transition = 'stroke-dashoffset 1s cubic-bezier(1, 0.23, 0.92, 0.96)';
      pathElement.style.strokeDashoffset = '0';

      setTimeout(() => {
          pathElement.style.strokeDasharray = 'none';
          pathElement.style.strokeDashoffset = 'none';
          pathElement.style.transition = 'none';
          this.triggerZoom(polyline);
      }, 1600);
  }

  private triggerZoom(polyline: L.Polyline): void {
      this.map.flyToBounds(polyline.getBounds(), {
          padding: [50, 50],
          duration: 2,
          easeLinearity: 0.5
      });
  }

  private animateScanningEffect(startNodeId: number): void {
      this.scanLayers.forEach(l => this.map.removeLayer(l));
      this.scanLayers = [];

      const startNode = this.graphData.nodes[startNodeId];
      const addedNeighborIds = new Set<number>();

      this.graphData.edges.forEach(edge => {
          if (edge.u === startNodeId && !addedNeighborIds.has(edge.v)) {
                this.drawFlowingLine(startNode, this.graphData.nodes[edge.v]);
                addedNeighborIds.add(edge.v);
          }
          else if (edge.v === startNodeId && !addedNeighborIds.has(edge.u)) {
                this.drawFlowingLine(startNode, this.graphData.nodes[edge.u]);
                addedNeighborIds.add(edge.u);
          }
      });

      setTimeout(() => {
          this.scanLayers.forEach(l => this.map.removeLayer(l));
          this.scanLayers = [];
      }, 1500);
  }

  private drawFlowingLine(startNode: Node, neighborNode: Node): void {
      const farPoint = this.extrapolatePoint(
          startNode.lat, startNode.lon,
          neighborNode.lat, neighborNode.lon,
          2.0
      );

      const line = L.polyline(
          [[startNode.lat, startNode.lon], farPoint],
          {
              color: '#2b5bcc90',
              weight: 6,
              className: 'flowing-scan-line',
              interactive: false
          }
      ).addTo(this.map);

      this.scanLayers.push(line);
  }

  private extrapolatePoint(startLat: number, startLon: number, endLat: number, endLon: number, multiplier: number): L.LatLngExpression {
    const latDiff = endLat - startLat;
    const lonDiff = endLon - startLon;
    const newLat = startLat + (latDiff * multiplier);
    const newLon = startLon + (lonDiff * multiplier);

    return [newLat, newLon];
  }
}

// --- UTILITY: SIMPLE PRIORITY QUEUE (Must be defined for the component to work) ---
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
        // The '!' is the non-null assertion operator, assuming the queue is not empty when dequeue is called.
        return this.items.shift()!; 
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}