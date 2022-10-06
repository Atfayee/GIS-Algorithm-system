import { EventEmitter, Injectable } from '@angular/core';
import { GeoJSON2String, GeoJsonSource, String2GeoJSON } from 'src/app/lib/services/geojson-source';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
@Injectable({
  providedIn: 'root'
})
export class MapProjectionService {
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
  /**
  *
  */
  constructor() {
    this._source = new GeoJsonSource();
    this._displaySource = new GeoJsonSource();
  }

  /**
   *
   * @returns
   */
  public createFileName() {
    return uuidv4() + '.json';
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

  /**
   *
   */
   public saveFile(filename) {
    this.displaySource.saveFile(filename);
  }

  /**
   * 恢复source
   */
   public reset() {
    const geojson = String2GeoJSON(this.source.geojson_string);
    this.displaySource.geojson_string = GeoJSON2String(geojson, true);
  }



  public toMercatorTurf() {
    const converted = turf.toMercator(this.source.geojson);
    this._displaySource.geojson_string = GeoJSON2String(converted, true);
  }
  
  public toMercator() {
    const earthRadius = 6378137.0;
    const geojson = String2GeoJSON(this.source.geojson_string);
    turf.coordEach(geojson, (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geonetryIndex) => {
      const x = currentCoord[0] * Math.PI / 180.0;
      const y = Math.log(Math.tan((90.0 + currentCoord[1]) * Math.PI / 360.0));
      currentCoord[0] = earthRadius * x;
      currentCoord[1] = earthRadius * y;
    });
    this._displaySource.geojson_string = GeoJSON2String(geojson, true);
  }
}
