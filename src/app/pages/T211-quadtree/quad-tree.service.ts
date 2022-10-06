import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { GeoJSON2String, GeoJsonSource, String2GeoJSON } from 'src/app/lib/services/geojson-source';
import { GeodeticQuaternaryCode } from 'src/app/lib/services/geohash/geodetic-quaternary-code';
import { QuaternaryCode } from 'src/app/lib/services/geohash/quaternary-code';
import * as CodeMirror from 'codemirror';
import { RouterLinkWithHref } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class QuadTreeService {

  /**
   * feature 定位事件
   */
  locationFeature: EventEmitter<any> = new EventEmitter();

  private _source: GeoJsonSource;
  public get source() {
    return this._source;
  }
  public setDisplay(visible: boolean) {
    this._source.maplayer.setVisible(visible);
  }

  /**
   *
   */
  constructor() {
    this._source = new GeoJsonSource();
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
      this.source.geojson_string = event.target.result as string;
    };
    reader.readAsText(file, 'utf-8');
  }

  /**
   *
   */
  public saveFile(filename) {
    this.source.saveFile(filename);
  }

  /**
   * 生成网格
   */
  public buildGrid() {
    const gm = new GeodeticQuaternaryCode();
    const m = new QuaternaryCode();

    if (this.source.geojson != null) {
      const geojson = String2GeoJSON(this.source.geojson_string);
      turf.featureEach(geojson, function (currentFeature, featureIndex) {
        //TODO: 请同学们完成
        //=currentFeature
        //=featureIndex
        const row = currentFeature.properties.row;
        const column = currentFeature.properties.column;
        const deep = currentFeature.properties.deep;
        const morton = m.encoding(row, column, deep);
        const box = gm.decoding(morton);
        const feature = turf.polygon([[[box.west, box.south], [box.west, box.north], [box.east, box.north], [box.east, box.south], [box.west, box.south]]]);
        currentFeature.properties.geohash = morton;
        currentFeature.geometry = feature.geometry;

      });
      this.source.geojson_string = GeoJSON2String(geojson, true);
    }
  }

  /**
   * 合并网格
   */
  public mergeGrid() {
    this.buildGrid();
    //TODO: 请同学们完成
    const gm = new GeodeticQuaternaryCode();
    const m = new QuaternaryCode();
    let a = [], b = [];
    let big_a = [], big_b = [];
    let small_a = [], small_b = [];

    let result_grid = [];

    // let new_feature = {};
    // let new_geometry = {};
    // let new_properties = {};
    // let new_type;

    let features = [];

    if (this.source.geojson != null) {
      const geojson = String2GeoJSON(this.source.geojson_string);
      let result;
      turf.featureEach(geojson, function (currentFeature, featureIndex) {
        result = m.decoding(currentFeature.properties.geohash);
        result['value'] = currentFeature.properties.value;
        result['geohash'] = currentFeature.properties.geohash;
        a.push(result);
      });

      big_a = this.mergeValue(a)['bigGrid'];
      small_a = this.mergeValue(a)['smallGrid'];

      // for (let i = 0; i < big_a.length; i++) { b.push(big_a[i]); }
      // for (let i = 0; i < small_a.length; i++) { b.push(small_a[i]); }
      // b.sort(function (b1, b2) {
      //   let b1_geohash = b1['geohash'];
      //   let b2_geohash = b2['geohash'];
      //   if (b1_geohash < b2_geohash) {
      //     return -1;
      //   }
      //   else {
      //     return 1;
      //   }
      // });
      // big_b = (this.mergeValue(b))['bigGrid'];
      // small_b =(this.mergeValue(b))['smallGrid'];
      big_b = this.mergeValue(big_a)['bigGrid'];
      small_b = this.mergeValue(big_a)['smallGrid'];
      for (let i = 0; i < big_b.length; i++) {
        big_b[i]['column']/=4;
        big_b[i]['row']/=4;
        big_b[i]['geohash']=big_b[i]['geohash'].substring(0,15);
        big_b[i]['deep']=14;
        result_grid.push(big_b[i]);
      }
      for (let i = 0; i < small_b.length; i++) {
        small_b[i]['column']/=2;
        small_b[i]['row']/=2; 
        small_b[i]['geohash']=small_b[i]['geohash'].substring(0,16);
        small_b[i]['deep']=15;
        result_grid.push(small_b[i]); }
      for (let i = 0; i < small_a.length; i++) {
        result_grid.push(small_a[i]);
      }
      for (let i = 0; i < result_grid.length; i++) {
        let new_feature = {};
        let new_geometry = {};
        let new_properties = {};
        let new_type;
        let bei: number;
        
        let morton = m.encoding(result_grid[i]['row'], result_grid[i]['column'], result_grid[i]['deep']);
        let box = gm.decoding(morton);
        let box_sidelength=box.east-box.west;
        // let feature = turf.polygon([[[box.west, box.south], [box.west, box.north + box_sidelength * bei], [box.east + box_sidelength * (bei + 0.1), box.north + box_sidelength * bei], [box.east + box_sidelength * (bei + 0.1), box.south], [box.west, box.south]]]);
        const feature = turf.polygon([[[box.west, box.south], [box.west, box.north], [box.east, box.north], [box.east, box.south], [box.west, box.south]]]);
        new_geometry = feature.geometry;

        result_grid[i]['geohash'] = morton;
        new_properties = result_grid[i];

        new_type = "Feature";

        new_feature['type'] = new_type;
        new_feature['properties'] = new_properties;
        new_feature['geometry'] = new_geometry;
        features.push(new_feature);

      }
      geojson['features'] = features;

      this.source.geojson_string = GeoJSON2String(geojson, true);
    }

  }

  private mergeValue(grid_list) {
    let bigGrid = [];
    let smallGrid = [];
    for (let i = 0; i < grid_list.length; i += 4) {
      if (grid_list.length - i < 4) {
        smallGrid.push(grid_list[i]);
        smallGrid.push(grid_list[i + 1]);
      } else {
        const fir = grid_list[i];
        const sec = grid_list[i + 1];
        const th = grid_list[i + 2];
        const fo = grid_list[i + 3];
        if ((fir['value'] === sec['value']) && (sec['value'] === th['value']) && (th['value'] === fo['value'])) {
          bigGrid.push(fir);
        } else {
          smallGrid.push(fir, sec, th, fo);
        }
      }

    }
    return { 'bigGrid': bigGrid, 'smallGrid': smallGrid };
  }




}

