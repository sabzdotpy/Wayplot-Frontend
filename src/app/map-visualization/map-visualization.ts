import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';

import { NgIf } from '@angular/common';
import { environment } from '../../environments/environment';

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

// Interface for the data expected back from the server API
interface RouteResponse {
  status: string;
  mode: string;
  path_node_ids: number[];
  path_coords: [number, number][]; // The critical list of coordinates for drawing
  total_cost: number;
  total_physical_distance: number;
  units: string;
  turn_count: number;   
}


@Component({
  selector: 'app-map-visualization',
  standalone: true,
  imports: [FormsModule, ToastrModule, NgIf],
  templateUrl: './map-visualization.html',
  styleUrl: './map-visualization.css',
})
export class MapVisualization implements OnInit, AfterViewInit, OnDestroy {
  // --- CONFIGURATION & CONSTANTS ---
  private CLOUDINARY_JSON_URL = '';
  // Set this to your Python backend URL for routing
  private readonly API_URL = `${environment.DJANGO_API_URL}/routing/calculate/`;

  // --- ANGULAR STATE (Bound to HTML) ---
  statusMessage: string = 'Initializing...';
  mapName: string = '';

  navigationMode: string = 'shortest';
  startLocationText: string = '';
  endLocationText: string = '';

  osmTileUrl: string = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  googleTileUrl: string = "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga";
  currentTile: 'osm' | 'google' = 'osm';
  private tileLayer!: L.TileLayer;

  // --- LEAFLET/GRAPH STATE ---
  private map!: L.Map;
  private graphData!: Graph;
  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;
  private pathPolyline: L.Polyline | null = null;
  private watchId: number | null = null;
  private scanLayers: L.Polyline[] = []; // For animation

  // Node IDs for API request
  startNodeId: number | null = null;
  endNodeId: number | null = null;
  // NEW: Optimized lookup for fast ID-to-Node access
  private idToNodeMap: Map<number, Node> = new Map();

  // --- ICONS ---
  private startIcon = L.icon({
    iconUrl: 'assets/red.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  private endIcon = L.icon({
    iconUrl: 'assets/green.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  private trackingIcon = L.icon({
    iconUrl: 'assets/userLoc.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, 0],
    shadowSize: [0, 0],
  });

  // --- CONSTRUCTOR & LIFECYCLE HOOKS ---
  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const mapUrl = params['mapurl'];
      const mName = params['mapname'];

      if (mapUrl) {
        if (this.CLOUDINARY_JSON_URL !== mapUrl) {
          this.CLOUDINARY_JSON_URL = mapUrl;
          this.mapName = mName || 'Map Visualization';

          // Reset map and load graph when URL changes
          if (this.map) this.resetMap();
          this.loadGraphData();
        }
      } else {
        this.statusMessage = "Sorry, Map url doesn't exist!";
        this.cd.detectChanges();
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
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }

  // --- MAP INITIALIZATION & DATA LOADING ---

  private initMap(): void {
    // Default view, will be overwritten by fitBounds later
    this.map = L.map('map').setView([10.782618989301367, 79.13152400187874], 17);
    this.tileLayer = L.tileLayer(this.osmTileUrl, {
      maxZoom: 19,
      attribution: (this.currentTile === 'google') ? '© Google Maps' : '© OpenStreetMap',
    });
    this.tileLayer.addTo(this.map);
    this.map.on('click', this.onMapClick.bind(this));
  }

  public switchTileLayer(): void {
    if (!this.map || !this.tileLayer) return;
    this.map.removeLayer(this.tileLayer);
    if (this.currentTile === 'google') {
      this.tileLayer = L.tileLayer(this.osmTileUrl, {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      });
      this.currentTile = 'osm';
    } else {
      this.tileLayer = L.tileLayer(this.googleTileUrl, {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      });
      this.currentTile = 'google';
    }
    this.drawInitialEdges();
    this.tileLayer.addTo(this.map);
    // bring overlays to front after tile switch
    if (this.pathPolyline) this.pathPolyline.bringToFront();
    if (this.startMarker) (this.startMarker as any).bringToFront(); // leaflet marker type missing bringToFront
    if (this.endMarker) (this.endMarker as any).bringToFront();
    this.scanLayers.forEach(l => l.bringToFront());
    this.cd.detectChanges();
  }

  private loadGraphData(): void {
    this.http.get<Graph>(this.CLOUDINARY_JSON_URL).subscribe({
      next: (data) => {
        console.log(data);
        this.graphData = data;
        // NEW: Populate the ID to Node Map
        this.idToNodeMap = new Map(data.nodes.map((node) => [node.id, node]));
        this.statusMessage = 'Graph data loaded. Click map to set <b>Start</b>.';
        this.drawInitialEdges();
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Error loading graph data. Please try again later.', 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 5000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
        
        console.error('Failed to load graph data:', err);
        this.statusMessage = 'Error loading JSON. Check console for details.';
        this.cd.detectChanges();
      },
    });
  }

  // FIXED: Only draws the gray polyline for the edges/roads
  private drawInitialEdges(): void {
    // Clear any previous edge layers (if the map loads a new JSON)
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Polyline && layer.options.color === '#888') {
        this.map.removeLayer(layer);
      }
    });

    const edgeCoords: L.LatLngExpression[][] = [];
    this.graphData.edges.forEach((edge) => {
      // Find nodes by ID, assuming nodes array is indexed by ID, or using edge.u/v as index
      // NEW: Use the safe lookup map
      const node1 = this.idToNodeMap.get(edge.u);
      const node2 = this.idToNodeMap.get(edge.v);
      if (node1 && node2) {
        edgeCoords.push([
          [node1.lat, node1.lon],
          [node2.lat, node2.lon],
        ]);
      }
    });

    // Draw edges: Campus Roads (Graph Edges)
    L.polyline(edgeCoords, { color: (this.currentTile === 'osm' ? '#888' : 'transparent'), weight: 2, opacity: (this.currentTile === 'google' ? 0 : 0.6) }).addTo(this.map);

    this.statusMessage = 'Ready. Click map to set <b>Start</b>.';
    this.map.fitBounds([
      [this.graphData.bounds[0][0], this.graphData.bounds[0][1]],
      [this.graphData.bounds[1][0], this.graphData.bounds[1][1]],
    ]);
  }

  // --- MAP CLICK HANDLER ---

  private onMapClick(e: L.LeafletMouseEvent): void {
    if (!this.graphData) {
      this.statusMessage = 'Data not yet loaded.';
      this.cd.detectChanges();
      return;
    }

    // Use the new function signature: returns Node or null
    const nearestNode = this.findNearestNode(e.latlng.lat, e.latlng.lng);

    if (!nearestNode) {
      this.statusMessage = 'Error: Node ID not found.';
      this.cd.detectChanges();
      return;
    }

    const distanceToNode = this.calculateDistance(
      e.latlng.lat,
      e.latlng.lng,
      nearestNode.lat,
      nearestNode.lon
    );
    const MAX_DISTANCE_M = 1000;

    if (distanceToNode > MAX_DISTANCE_M) {
      this.statusMessage = '🔴 Alert: The selected location is too far from the campus roads.';
      this.cd.detectChanges();
      return;
    }

    const markerLatLon: L.LatLngExpression = [nearestNode.lat, nearestNode.lon];

    if (this.startNodeId !== null && this.endNodeId === null) {
      // Set End Node
      if (this.endMarker) this.map.removeLayer(this.endMarker);
      this.endNodeId = nearestNode.id; // Use the actual node ID
      this.endMarker = L.marker(markerLatLon, { title: 'End', icon: this.endIcon }).addTo(this.map);
      this.endLocationText = `${nearestNode.lat.toFixed(5)}, ${nearestNode.lon.toFixed(5)}`;
      this.statusMessage = 'Ready. Press <b>Calculate Route</b>.';
    } else if (this.startNodeId === null) {
      // Set Start Node
      if (this.watchId !== null) {
        this.statusMessage =
          'Please click "Clear Route" to stop tracking before setting a manual Start point.';
        this.cd.detectChanges();
        return;
      }
      if (this.startMarker) this.map.removeLayer(this.startMarker);
      this.startNodeId = nearestNode.id; // Use the actual node ID
      this.startMarker = L.marker(markerLatLon, { title: 'Start', icon: this.startIcon }).addTo(
        this.map
      );
      this.startLocationText = `${nearestNode.lat.toFixed(5)}, ${nearestNode.lon.toFixed(5)}`;
      this.statusMessage = 'Start set. Click again to set <b>End</b>.';
    }
    this.cd.detectChanges();
  }

  public resetMap(): void {
    this.stopTracking();
    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
      this.endMarker = null;
    }
    if (this.pathPolyline) {
      this.map.removeLayer(this.pathPolyline);
      this.pathPolyline = null;
    }
    this.scanLayers.forEach((l) => this.map.removeLayer(l));
    this.scanLayers = [];

    this.startNodeId = null;
    this.endNodeId = null;
    this.startLocationText = '';
    this.endLocationText = '';

    this.statusMessage = 'Map reset. Click map to set <b>Start</b>.';
    this.cd.detectChanges();
  }

  private findNearestNode(lat: number, lon: number): Node | null {
    let closestNode: Node | null = null;
    let minDistanceSq = Infinity;

    // Iterate safely over all Node objects
    for (const node of this.idToNodeMap.values()) {
      const distSq = (node.lat - lat) ** 2 + (node.lon - lon) ** 2;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestNode = node;
      }
    }
    return closestNode; // Return the full Node object
  }

  // Haversine Distance
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δλ / 2) * Math.sin(Δλ / 2) * Math.cos(φ1) * Math.cos(φ2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // --- GEOLOCATION AND TRACKING (Kept for completeness) ---

  public fetchCurrentLocation(): void {
    if (!this.graphData) {
      this.statusMessage = 'Data not yet loaded.';
      this.cd.detectChanges();
      return;
    }
    if (this.watchId !== null) {
      this.statusMessage = 'Currently tracking movement.';
      this.cd.detectChanges();
      return;
    }
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

    const nearestNode = this.findNearestNode(lat, lon);
    if (!nearestNode) {
      this.statusMessage = 'Error: Could not find nearest node.';
      this.cd.detectChanges();
      return;
    }

    const distanceToNode = this.calculateDistance(lat, lon, nearestNode.lat, nearestNode.lon);
    const MAX_DISTANCE_M = 150;  // 150 meters

    if (distanceToNode > MAX_DISTANCE_M) {
      this.stopTracking();
      this.resetMap();
      this.statusMessage =
        '🔴 Alert: Your current location is far away from the mapped area. Tracking stopped.';
      this.cd.detectChanges();
      return;
    }

    if (!this.startMarker) {
      this.startMarker = L.marker(markerLatLon, {
        title: 'Live Location',
        icon: this.trackingIcon,
      }).addTo(this.map);
      this.map.flyTo(markerLatLon, 16);
    } else {
      this.startMarker.setLatLng(markerLatLon);
      if (this.startMarker.options.icon !== this.trackingIcon) {
        this.startMarker.setIcon(this.trackingIcon);
      }
    }

    this.startNodeId = nearestNode.id;
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

  // --- ROUTE CALCULATION (API POST) ---

  public calculateRoute(): void {
    if (this.startNodeId === null || this.endNodeId === null) {
      this.statusMessage = 'Please set both Start and End points.';
      return;
    }

    // 1. Clear previous route and start animation
    if (this.pathPolyline) this.map.removeLayer(this.pathPolyline);
    this.statusMessage = `Calculating route via ${this.navigationMode}...`;
    this.animateScanningEffect(this.startNodeId);

    // 2. Prepare request body
    const requestBody = {
      source_id: this.startNodeId,
      target_id: this.endNodeId,
      mode: this.navigationMode,
      map_url: this.CLOUDINARY_JSON_URL,
    };

    // 3. Send request to backend
    this.http.post<RouteResponse>(this.API_URL, requestBody).subscribe({
      next: (response) => {
        // Stop scanning effect after path is found
        this.scanLayers.forEach((l) => this.map.removeLayer(l));
        this.scanLayers = [];

        if (response.path_coords.length > 0) {
          this.drawRoute(response.path_coords);
          let turnMessage = '';
        if (response.mode === 'least_turn') {
            turnMessage = `<br>Turns: <b>${response.turn_count}</b>`;
        }

          this.statusMessage = `
                    <b>Path Found! (${response.mode})</b><br>
                    Distance: ${response.total_physical_distance.toFixed(2)} meters
                    ${turnMessage}<br>
                    Total Cost: ${response.total_cost.toFixed(2)} ${response.units}
                    
                `;
        } else {
          this.statusMessage = `No path found for ${response.mode} routing.`;
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toastr.error('Error connecting to routing service. Please try again later.', 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 5000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
        console.error('Routing API Error:', err);
        // Example of better error handling
        const detail =
          err.error?.detail ||
          'Could not connect to routing service (http://127.0.0.1:8000/route).';
        this.statusMessage = `Error: ${detail}`;
        this.scanLayers.forEach((l) => this.map.removeLayer(l));
        this.scanLayers = [];
        this.cd.detectChanges();
      },
    });
  }

  // --- PATH VISUALIZATION & ANIMATION ---

  private drawRoute(pathCoords: [number, number][]): void {
    if (!this.map) return;

    if (this.pathPolyline) this.map.removeLayer(this.pathPolyline);

    let color;
    if (this.navigationMode === 'shortest') {
      color = 'blue';
    }
    else if (this.navigationMode === 'least_turn') {
      color = 'green';
    } else {
      color = 'red';
    }

    // Draw the static route line (initially invisible)
    this.pathPolyline = L.polyline(pathCoords as L.LatLngExpression[], {
      color: color,
      weight: 5,
      opacity: 0,
    }).addTo(this.map);

    this.animatePolylinePath(this.pathPolyline);
  }

  // --- Animation Helpers (Kept as provided) ---

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
      easeLinearity: 0.5,
    });
  }

  private animateScanningEffect(startNodeId: number): void {
    this.scanLayers.forEach((l) => this.map.removeLayer(l));
    this.scanLayers = [];

    const startNode = this.idToNodeMap.get(startNodeId);
    if (!startNode) return;
    const addedNeighborIds = new Set<number>();

    this.graphData.edges.forEach((edge) => {
      // ...
      if (edge.u === startNodeId && !addedNeighborIds.has(edge.v)) {
        const neighborNode = this.idToNodeMap.get(edge.v);
        if (neighborNode) this.drawFlowingLine(startNode, neighborNode);
        addedNeighborIds.add(edge.v);
      } else if (edge.v === startNodeId && !addedNeighborIds.has(edge.u)) {
        const neighborNode = this.idToNodeMap.get(edge.u);
        if (neighborNode) this.drawFlowingLine(startNode, neighborNode);
        addedNeighborIds.add(edge.u);
      }
    });

    // Clear the effect after 1.5 seconds, even if the API hasn't responded
    setTimeout(() => {
      this.scanLayers.forEach((l) => this.map.removeLayer(l));
      this.scanLayers = [];
    }, 1500);
  }

  private drawFlowingLine(startNode: Node, neighborNode: Node): void {
    const farPoint = this.extrapolatePoint(
      startNode.lat,
      startNode.lon,
      neighborNode.lat,
      neighborNode.lon,
      2.0
    );

    const line = L.polyline([[startNode.lat, startNode.lon], farPoint], {
      color: '#2b5bcc90',
      weight: 6,
      className: 'flowing-scan-line',
      interactive: false,
    }).addTo(this.map);

    this.scanLayers.push(line);
  }

  private extrapolatePoint(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    multiplier: number
  ): L.LatLngExpression {
    const latDiff = endLat - startLat;
    const lonDiff = endLon - startLon;
    const newLat = startLat + latDiff * multiplier;
    const newLon = startLon + lonDiff * multiplier;

    return [newLat, newLon];
  }

  public goBack(): void {
    window.history.back();
  }
}
