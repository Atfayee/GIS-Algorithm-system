import { EventEmitter, Injectable } from '@angular/core';
import { GeoJSON2String, GeoJsonSource, String2GeoJSON } from 'src/app/lib/services/geojson-source';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { area } from 'd3-shape';

@Injectable({
  providedIn: 'root'
})
export class MapMeasureService {

  /**
   * feature 定位事件
   */
  locationFeature: EventEmitter<any> = new EventEmitter();


  /**
   * 加载文件数据
   */
  loadFile: EventEmitter<any> = new EventEmitter();

  private _source: GeoJsonSource;
  public get source() {
    return this._source;
  }

  private _displaySource: GeoJsonSource;
  public get displaySource() {
    return this._displaySource;
  }

  public setDisplay(visible: boolean) {
    this._displaySource.maplayer.setVisible(visible);
  }

  constructor() {
    this._source = new GeoJsonSource();
    this._displaySource = new GeoJsonSource();
  }
  /**
     * 恢复source
     */
  public reset() {
    const geojson = String2GeoJSON(this.source.geojson_string);
    this.displaySource.geojson_string = GeoJSON2String(geojson, true);
  }


  /**
   *
   * @returns
   */
  public createFilename() {
    return uuidv4() + '.json';
  }
  public saveFile(filename) {
    this.displaySource.saveFile(filename);
  }

  /**
   *
   * @param file
   */
  public openFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      this.loadFile.emit();
      this.source.geojson_string = event.target.result as string;
      this.reset();
    };
    reader.readAsText(file, 'utf-8');
  }


  public measureTurf() {
    if (this.source.geojson_string != null) {
      if (this.source.geojson.type == 'FeatureCollection') {
        let features=[];
        for (let i = 0; i < this.source.geojson.features.length; i++) {
          const feature = this.source.geojson.features[i];
          const area = turf.area(feature);
          if (feature.properties['area_turf'] == undefined) {
            feature.properties['area_turf'] = {};
          }
          feature.properties['area_turf'] = area;
          features.push(feature);
        }
        this.displaySource.geojson.features=features;
        this.displaySource.geojson_string = GeoJSON2String(this.displaySource.geojson, true);
      }
    }
  }


  public measureCartesian() {
    if (this.source.geojson_string != null) {
      if (this.source.geojson.type == 'FeatureCollection') {
        let features=[];
        for (let i = 0; i < this.source.geojson.features.length; i++) {
          const feature = this.source.geojson.features[i];
          const area = this.geometryAreaByPlane(feature.geometry)*10000000000;
          if (feature.properties['area_plane'] == undefined) {
            feature.properties['area_plane'] = {};
          }
          feature.properties['area_plane'] = area;
          features.push(feature);
        }
        this.displaySource.geojson.features=features;
        this.displaySource.geojson_string = GeoJSON2String(this.displaySource.geojson, true);
      }
    }
  }
  private geometryAreaByPlane(geometry) {
    switch (geometry.type) {
      case 'MultiPolygon':
        return this.multiPolygonAreaByPlane(geometry.coordinates);
      case 'Polygon':
        return this.polygonAreaByPlane(geometry.coordinates);
      default:
        return 0.0;
    }
  }
  private multiPolygonAreaByPlane(coordinates) {
    let area = 0.0;
    for (let i = 0; i < coordinates.length; i++) {
      area += this.polygonAreaByPlane(coordinates[i]);
    }
    return area;
  }
  private polygonAreaByPlane(coordinates) {
    let area = 0.0;
    for (let i = 0; i < coordinates.length; i++) {
      area += this.planeArea(coordinates[i]);
    }
    return area;
  }
  private planeArea(coordinates) {
    const length = coordinates.length;
    if (length < 3) return 0.0;
    let area = 0.0;
    for (let i = 0; i < length - 1; i++) {
      area += coordinates[i][0] * coordinates[i + 1][1] - coordinates[i + 1][0] * coordinates[i][1];
    }
    return area * 0.5;
  }

  public measureSpheroid() {
    if (this.source.geojson != null) {
      if (this.source.geojson.type === 'FeatureCollection') {
        for (let i = 0; i < this.source.geojson.features.length; i++) {
          const feature = this.source.geojson.features[i];
          const area = this.geometryAreaBySphere(feature.geometry);
          if (feature.properties['area_turf'] === undefined) {
            feature.properties['area_turf'] = {};
          }
          feature.properties['area_turf'] = area;
        }
        this.source.geojson_string = GeoJSON2String(this.source.geojson, true);
      }
    }
  }
  private geometryAreaBySphere(geometry) {
    switch(geometry.type){
      case 'MultiPolygon':
        return this.multiPolygonAreaBySphere(geometry.coordinates);
      case 'Polygon':
        return this.polygonAreaBySphere(geometry.coordinates);
      default:
        return 0.0;
    }
  }
  private multiPolygonAreaBySphere(coordinates) {
    let area=0.0;
    for(let i=0;i<coordinates.length;i++){
      area+=this.polygonAreaBySphere(coordinates[i]);
    }
    return area;
  }
  private polygonAreaBySphere(coordinates) {
    let area=0.0;
    for (let i = 0; i < coordinates.length; i++) {
      area += this.sphereArea(coordinates[i]);
    }
    return area;
  }
  private sphereArea(coordinates) {
    let area=0.0;
    return area;
  }
}
