import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { GeoJSON2String, GeoJsonSource, String2GeoJSON } from 'src/app/lib/services/geojson-source';
import { feature } from '@turf/turf';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BufferOverlayService {
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

  private _activeSource: GeoJsonSource;
  public get activeSource() {
    return this._activeSource;
  }
  public set activeSource(value) {
    this._activeSource = value;
  }
  private _landuse;
  public get landuse() {
    return this._landuse;
  }
  public set landuse(value) {
    this._landuse = value;
  }
  private _swewers;
  public get swewers() {
    return this._swewers;
  }
  public set swewers(value) {
    this._swewers = value;
  }
  private _soil;
  public get soil() {
    return this._soil;
  }
  public set soil(value) {
    this._soil = value;
  }
  private _candidate;
  public get candidate() {
    return this._candidate;
  }
  public set candidate(value) {
    this._candidate = value;
  }
  private _swewers_buffer_radius = 300.0;
  public get swewers_buffer_radius() {
    return this._swewers_buffer_radius;
  }
  public set swewers_buffer_radius(value) {
    this._swewers_buffer_radius = value;
  }
  /**
   * 
   */
  constructor() {
    this._landuse = new GeoJsonSource();
    this._swewers = new GeoJsonSource();
    this._soil = new GeoJsonSource();
    this._candidate = new GeoJsonSource();

    this.downloadFile();
  }

  public downloadFile() {
    this._landuse.fromUrl(environment.t216_buffer_overlay.landuse_url);
    this._swewers.fromUrl(environment.t216_buffer_overlay.sewers_url);
    this._soil.fromUrl(environment.t216_buffer_overlay.soil_url);
    this._candidate.geojson_string = '';

    this._activeSource = this._landuse;
  }


  /**
   * 保存文件
   */
  public saveFile(filename) {
    this.activeSource.saveFile(filename);
  }
  /**
   *
   * @returns
   */
  public createFileName() {
    return uuidv4() + '.json';
  }


  /**
   * 恢复source
   */
  public reset() {
    const geojson = String2GeoJSON(this.source.geojson_string);
    this.activeSource.geojson_string = GeoJSON2String(geojson, true);
  }

  public setActiveSource(value: String) {
    if (value == 'landuse') {
      this.activeSource = this.landuse;
    } else if (value == 'soil') {
      this.activeSource = this.soil;
    } else if (value == 'serwers') {
      this.activeSource = this.swewers;
    } else {
      this.activeSource = this.candidate;
    }
  }
  public setLanduseDisplay(visible: boolean) {
    this.landuse.maplayer.setVisible(visible);
  }
  public setSoilDisplay(visible: boolean) {
    this.soil.maplayer.setVisible(visible);
  }
  public setSewersDisplay(visible: boolean) {
    this.swewers.maplayer.setVisible(visible);
  }
  public setCandidateDisplay(visible: boolean) {
    this.candidate.maplayer.setVisible(visible);
  }





  /**
   * 选址分析
   */
  public overlayer() {
    const landuseFeature = this.unionPolygon(this.selectLanduse(this.landuse.geojson));
    const soilFeature = this.unionPolygon(this.selectSoil(this.soil.geojson));

    const sewerBuffer = turf.buffer(this.swewers.geojson, this.swewers_buffer_radius, { units: 'meters' });
    const sewersFeature = this.unionPolygon(this.selectSewers(sewerBuffer));

    let intersection = turf.intersect(landuseFeature, soilFeature);
    intersection = turf.intersect(intersection, sewersFeature);

    this.candidate.geojson_string = GeoJSON2String(intersection, true);
  }

  /**
   * 
   * @param geojson 
   * @returns 
   */
  private selectLanduse(geojson) {
    const features = [];
    geojson.features.forEach(feature => {
      if (feature.properties['LUCODE'] == 300) {
        features.push(feature);
      }
    });
    return features;
  }

  /**
   * 
   * @param geojson 
   * @returns 
   */
  private selectSoil(geojson) {
    const features = [];
    geojson.features.forEach(feature => {
      if (feature.properties['SUIT'] >= 2) {
        features.push(feature);
      }
    });
    return features;
  }

  /**
   * 
   * @param geojson 
   * @returns 
   */
  private selectSewers(geojson) {
    return geojson.features;
  }

  /**
   * 
   * @param features 
   * @returns 
   */
  private unionPolygon(features) {
    let f1 = features[0];
    for (let i = 1; i < features.length; i++) {
      let f2 = features[i];
      f1 = turf.union(f1, f2);
    }
    return f1;
  }
}
