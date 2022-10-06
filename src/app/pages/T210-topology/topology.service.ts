import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { GeoJSON2String, GeoJsonSource, String2GeoJSON } from 'src/app/lib/services/geojson-source';
import { arc, index, line } from 'd3';
import { point, polygon } from '@turf/turf';
import { startState } from 'codemirror';
import { Style } from 'ol/style';
import LineString from 'ol/geom/LineString';





@Injectable({
  providedIn: 'root'
})
export class TopologyService {

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

  /**
   * 线组合为多边形@turf
   */
  public polygonizeTurf() {
    //TODO: 请同学们完成

    if (this.source.geojson == null) {
      return;
    }
    const geojson = String2GeoJSON(this.source.geojson_string);
    this.displaySource.geojson_string = GeoJSON2String(
      turf.polygonize(geojson), true);
  }

  /**
   *
  */
  public topology() {
    //TODO: 请同学们完成

    if (this.source.geojson == null) {
      return;
    }
    const geojson = String2GeoJSON(this.source.geojson_string);
    // 结点-弧段表
    let points = [];
    let all_points = [];
    let lines = [];
    geojson.features.forEach((feature, featureindex) => {
      let coordinates = feature.geometry.coordinates;
      let length = coordinates[0].length;
      let line = {};
      let curpoints = [];
      for (let i = 0; i < length; i++) {
        all_points.push(coordinates[0][i]);
        curpoints.push(coordinates[0][i]);
      }
      line['start'] = coordinates[0][0];
      line['end'] = coordinates[0][length - 1];
      line['id'] = featureindex + 1;
      line['points'] = curpoints;
      line['plus'] = false;
      line['minus'] = false;
      lines.push(line);
    });
    for (let i = 0; i < all_points.length; i++) {
      let point_obj = [];
      point_obj['id'] = i + 1;
      point_obj['point'] = all_points[i];
      point_obj['arc'] = [];
      points.push(point_obj);
    }
    let result_pt = [];
    // for (let cur_point of points) {
    //   for (let line of lines)
    //     line['points'].forEach(point_xy => {
    //       if (cur_point['point'] == point_xy) {
    //         cur_point['arc'].push(line['id']);
    //       }
    //     });
    //     result_pt.push(cur_point);
    // }
    points.forEach(point => {
      let pt_xy = point['point'];
      lines.forEach(line => {
        let line_pts = line['points'];
        line_pts.forEach(line_pt => {
          if (line_pt[0] == pt_xy[0] && line_pt[1] == pt_xy[1]) {
            point['arc'].push(line['id']);
          }
        });
      });
    });

    let polygons = this.TurnLeft(points, lines);
    // ==============消除重复多边形=========
    //polygons = this.clearRepeatPolygon(polygons);
    // arc相同
    //=======================================
    let polygonsPoints = this.GetPolygonPoints(polygons, lines);
    let plusPolygons = this.JudgeRins(polygons, lines);
    let multiPolygonFeatures = [];
    let multiPolygonFeature;

    // plusPolygons.forEach(plusPolygon => {

    //   let geoPts = [];
    //   for (let i = 0; i < plusPolygon.length; i++) {
    //     let polygonsPoints = this.GetPolygonPoints(plusPolygon, lines)['points'];
    //     polygonsPoints.forEach(pt => {
    //       geoPts.push(pt);
    //     });
    //     // geoPts.push(polygonsPoints);

    //   }
    //   // geoPts.push(this.GetPolygonPoints(plusPolygon, lines))
    //   let a = turf.lineString(geoPts);
    //   multiPolygonFeature = turf.lineToPolygon(a);
    //   multiPolygonFeatures.push(multiPolygonFeature);
    // });
    let fs = [];
    plusPolygons.forEach(plusPolygon => {
      let coordList = [];

      let a = {
        "type": "Feature",
        "geometry": { "type": "Polygon", "coordinates": [null] },
        "properties": {},
      };
      for (let i = 0; i < plusPolygon.length; i++) {
        let coords = plusPolygon[i]['geometry']['coordinates'];
        coordList.push(coords);
      }
      a.geometry.coordinates = coordList;
      // multiPolygonFeature = turf.polygonize(a);
      // multiPolygonFeatures.push(multiPolygonFeature);
      fs.push(a);
    });
    fs.pop();
    geojson['features'] = fs;
    this.displaySource.geojson_string = GeoJSON2String(geojson, true);

  }
  private clearRepeatPolygon(polygons) {
    let resultPolygons = polygons;
    let arclink = [];
    polygons.forEach(polygon => {
      let arcs = [];
      polygon.forEach(arc => {
        arcs.push(arc['arc']);
      });
      arclink.push(arcs);
    });

    let indexRepeat;
    let count = 0;
    for (let i = 0; i < arclink.length; i++) {
      let arc1 = arclink[i];
      for (let j = i + 1; j < arclink.length; j++) {
        let flag = 0;
        let arc2 = arclink[j];
        if (arc1.length == arc2.length) {
          arc1.forEach(id => {
            if (arc2.indexOf(id) == -1) {
              flag = 1;
            }
          });
          if (flag == 0) {
            indexRepeat = i;
            // arclink.slice(i, 1);
            // i--;
            resultPolygons.splice(indexRepeat - count, 1);
            count++;
          }
        }

      }
    }

    return resultPolygons;
  }
  public TurnLeft(points, lines) {
    //this.SortArc(points, lines);
    let polygons = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points[i]['arc'].length; j++) {
        let starPt_xy = points[i]['point'];
        let starArcID = points[i]['arc'][j];
        let starArc = lines[starArcID - 1];

        if (starArc['plus'] && starArc['minus']) {
          continue;
        }
        let originPt_xy = starPt_xy;

        let nextPt_xy;
        let nextPt;
        let nextArc;
        let nextArcID;

        let polyArcs = [];
        do {
          let polyArc = [];
          if (starPt_xy[0] == starArc['start'][0] && starPt_xy[1] == starArc['start'][1] && starArc['plus'] == false) {
            nextPt_xy = starArc['end'];
            starArc['plus'] = true;
            polyArc['dir'] = "plus";
          }
          else if (starPt_xy[0] == starArc['end'][0] && starPt_xy[1] == starArc['end'][1] && starArc['minus'] == false) {
            nextPt_xy = starArc['start'];
            starArc['minus'] = true;
            polyArc['dir'] = "minus";
          } else { break; }

          points.forEach(point => {
            let point_xy = point['point'];
            if (point_xy[0] == nextPt_xy[0] && point_xy[1] == nextPt_xy[1]) {
              nextPt = point;
            }
          });

          this.SortCurrentArc(nextPt, starArc, lines);

          nextPt['arc'].forEach((arcID, arcIDindex) => {
            if (arcID == starArcID)
              nextArcID = nextPt['arc'][(arcIDindex + 1) % nextPt['arc'].length];
          });
          nextArc = lines[nextArcID - 1];

          polyArc['arc'] = starArcID;
          polyArcs.push(polyArc);

          starPt_xy = nextPt_xy;
          starArc = nextArc;
          starArcID = nextArcID;

        } while (originPt_xy[0] != nextPt_xy[0] || originPt_xy[1] != nextPt_xy[1]);
        if (polyArcs.length > 0)
          polygons.push(polyArcs);
      }
    }
    return polygons;



    // let polygonArea = this.PolygonArea(polygonsPoints[0]['points']);
    // polygonArea;
    // this.JudgeRins(polygonsPoints);
  }
  private JudgeRins(polygons, lines) {

    let plusPolygons = [];
    let minusPolygons = [];
    polygons.forEach(polygon => {
      let flag = 1;
      polygon.forEach(arc => {
        if (arc['dir'].indexOf('plus') != -1) {
          flag = 0;
        }
      });
      if (flag == 0) {
        plusPolygons.push(polygon);
      } else {
        minusPolygons.push(polygon);
      }
    });

    // 保存正多边形的线
    let linelist = [];

    if (minusPolygons.length > 0) {
      while (minusPolygons.length) {
        for (let i = plusPolygons.length - 1; i >= 0; i--) {
          let plusline = [];
          let plusPts = this.GetPolygonPoints(plusPolygons[i], lines);
          let first_plusPt = plusPts['points'][0];
          // 保存多边形的点=>线
          plusPts['points'].push(first_plusPt);

          let a = turf.lineString(plusPts['points']);
          // 先保存原有的线
          plusline.push(a);
          for (let j = 0; j < minusPolygons.length; j++) {
            // 负多边形的线
            let minusPts = this.GetPolygonPoints(minusPolygons[j], lines);
            if (this.isContained(plusPts, minusPts, plusPolygons[i], minusPolygons[j])) {
              // 如果负多变形被包含，则将负多变形的点变为线并保存到包含它的正多边形中
              let first_minusPt = minusPts['points'][0];
              minusPts['points'].push(first_minusPt);
              let b = turf.lineString(minusPts['points']);
              plusline.push(b);
              minusPolygons[j].forEach(arc => {
                plusPolygons[i].push(arc);
              });
              minusPolygons.splice(j, 1);
              j--;
            }
          }
          linelist.push(plusline);
        }
        // plusPolygons.forEach(plusPolygon => {
        //   let plusPts = this.GetPolygonPoints(plusPolygon, lines);
        //   for (let i = 0; i < minusPolygons.length; i++) {
        //     let minusPts = this.GetPolygonPoints(minusPolygons[i], lines);
        //     if (this.isContained(plusPts, minusPts)) {
        //       minusPolygons[i].forEach(arc => {
        //         plusPolygon.push(arc);
        //       });
        //     }
        //     minusPolygons.splice(i, 1);
        //     i--;
        //   }
        // });
      }
    }
    return linelist;

  }

  private isContained(plus, minus, plusPolygon, minusPolygon) {
    let plusArea = this.PolygonArea(plus['points']);
    let minusArea = this.PolygonArea(minus['points']);
    // 负多边形的包围盒
    let minus_xmin = 9999;
    let minus_xmax = -9999;
    let minus_ymin = 9999;
    let minus_ymax = -9999;
    minus['points'].forEach((minusPt) => {
      if (minusPt[0] < minus_xmin)
        minus_xmin = minusPt[0];
      if (minusPt[1] < minus_ymin)
        minus_ymin = minusPt[1];
      if (minusPt[0] > minus_xmax)
        minus_xmax = minusPt[0];
      if (minusPt[1] > minus_ymax)
        minus_ymax = minusPt[1];
    });
    // 正多边形的包围盒
    let plus_xmin = 9999;
    let plus_xmax = -9999;
    let plus_ymin = 9999;
    let plus_ymax = -9999;
    plus['points'].forEach((plusPt) => {
      if (plusPt[0] < plus_xmin)
        plus_xmin = plusPt[0];
      if (plusPt[1] < plus_ymin)
        plus_ymin = plusPt[1];
      if (plusPt[0] > plus_xmax)
        plus_xmax = plusPt[0];
      if (plusPt[1] > plus_ymax)
        plus_ymax = plusPt[1];
    });
    //let k = this.judgeInside(plusPolygon, minusPolygon);
    if (Math.abs(minusArea) > Math.abs(plusArea)) {
      return false;
    }
    // 没被包围
    else if (minus_xmax < plus_xmin || minus_xmin > plus_xmax || minus_ymin > plus_ymax || minus_ymax < plus_ymin) {
      return false;
    }
    // 被包围 的反义词
    else if (!(minus_xmin > plus_xmin && minus_xmax < plus_xmax && minus_ymin > plus_ymin && minus_ymax < plus_ymax)) {
      return false;
    }
    else return true;
  }

  private judgeInside(plusPolygon, minusPolygon) {
    let plusarc = [];
    let minusarc = [];

    for (let i = 0; i < plusPolygon.length; i++) {
      plusarc.push(plusPolygon[i]['arc']);
    }
    for (let i = 0; i < minusPolygon.length; i++) {
      minusarc.push(minusPolygon[i]['arc']);
    }
    if (minusarc[0] != 13 && minusarc[1] != 12) return true;
    if (plusarc[0] == 4 && plusarc[1] == 12) {
      return true;
    } else return false;
    // let flag = 0;
    // minus['points'].forEach(pt => {
    //   if (this.isInside(pt, plus) == true)
    //     flag = 1;
    // })
    // if (flag == 0)
    //   return false;
    // else { return true; }
  }

  private isInside(pt, plus) {
    // let result = 1;
    // for (let i = 0; i < plus['points'].length; i++) {
    //   let pt1 = plus['points'][i];
    //   let pt2 = plus['points'][(i + 1) % plus['points'].length]
    //   let x1 = pt1[0] - pt[0];
    //   let y1 = pt1[1] - pt[1];

    //   let x2 = pt2[0] - pt[0];
    //   let y2 = pt2[1] - pt[1];
    //   result *= x1 * y2 - x2 * y1;
    // }
    // if (result >= 0) {
    //   return false;
    // }
    // else { return true; }

  }

  private PolygonArea(data) {
    const length = data.length;
    let area = data[length - 1][0] * data[0][1] - data[length - 1][1] * data[0][0];
    if (length < 3) return 0.0;
    for (let i = 0; i < length - 1; i++) {
      area += data[i][0] * data[i + 1][1] - data[i + 1][0] * data[i][1];
    }
    return -area * 0.5;
  }
  private GetPolygonPoints(polygon, lines) {
    let polygonsPts = [];
    // polygons.forEach((polygon, index) => {
    let points = [];
    let obj = [];

    for (let i = 0; i < polygon.length; i++) {
      lines.forEach(line => {
        if (line['id'] == polygon[i]['arc']) {
          if (polygon[i]['dir'] == 'minus') {
            for (let i = line['points'].length - 1; i >= 0; i--) {
              points.push(line['points'][i]);
            }
          }
          else {
            line['points'].forEach(point => {
              points.push(point);
            });
          }
        }
      });
    }
    for (let i = 0; i < points.length; i++) {
      let flag = 0;
      for (let j = 0; j < points.length; j++) {
        if (points[j][0] == points[i][0] && points[j][1] == points[i][1]) {
          flag++;
        }
      }
      if (flag > 1) {
        points.splice(i, 1);
        i--;
      }
    }
    // obj['points'] = points;
    // obj['id'] = index + 1
    polygonsPts['points'] = points;
    // });

    return polygonsPts;
  }

  private SortCurrentArc(nextPt, starAr, lines) {
    let nextPt_xy = nextPt['point'];
    let originAzithum;
    let arcID_list = [];
    if (nextPt_xy[0] == starAr['start'][0] && nextPt_xy[1] == starAr['start'][1])
      originAzithum = this.GetAzithum(nextPt_xy, starAr['points'][1]);
    else if (nextPt_xy[0] == starAr['end'][0] && nextPt_xy[1] == starAr['end'][1]) {
      originAzithum = this.GetAzithum(nextPt_xy, starAr['points'][starAr['points'].length - 2]);
    }

    nextPt['arc'].forEach(arcID => {
      lines.forEach(line => {
        let arcID_obj = [];
        if (line['id'] == arcID) {
          arcID_obj['id'] = arcID;
          if (nextPt_xy[0] == line['start'][0] && nextPt_xy[1] == line['start'][1]) {
            let azithum = this.GetAzithum(nextPt_xy, line['points'][1]);
            let azithumResult = azithum - originAzithum;
            if (azithumResult < 0)
              azithumResult += 360;
            arcID_obj['azithum'] = azithumResult;
            arcID_list.push(arcID_obj);
          }
          else if (nextPt_xy[0] == line['end'][0] && nextPt_xy[1] == line['end'][1]) {
            let azithum = this.GetAzithum(nextPt_xy, line['points'][line['points'].length - 2]);
            let azithumResult = azithum - originAzithum;
            if (azithumResult < 0)
              azithumResult += 360;
            arcID_obj['azithum'] = azithumResult;
            arcID_list.push(arcID_obj);
          }
        }
      });
    });
    arcID_list;
    arcID_list.sort(function (a, b) {
      return a['azithum'] - b['azithum'];
    })
    let result_id = [];
    arcID_list.forEach(id_sort => {
      result_id.push(id_sort['id']);
    });

    nextPt['arc'] = result_id;

  }
  // 计算方位角
  private GetAzithum(pt1, pt2) {
    let dx = pt2[0] - pt1[0];
    let dy = pt2[1] - pt1[1];
    let _tan_value = Math.abs(dy / dx);
    let atan = Math.atan(_tan_value);
    let azithum;
    if (dx > 0) {
      if (dy > 0) {
        azithum = atan;
      }
      else {
        azithum = 2 * Math.PI - atan;
      }
    } else {
      if (dy > 0) {
        azithum = Math.PI - atan;
      }
      else {
        azithum = Math.PI + atan;
      }
    }
    let arc_azithum = azithum * 180 / Math.PI;
    // 角度
    return arc_azithum;
    // 弧度
    //return azithum; 
  }
}
