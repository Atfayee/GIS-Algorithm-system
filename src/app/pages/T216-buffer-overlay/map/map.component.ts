import { Component, OnInit } from '@angular/core';

import { GUI } from 'dat.gui';

import { setUserProjection, useGeographic } from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';

import TDTLayerFactory from '../../../lib/ol/layer/tdt-layer-factory';
import TDTSourceFactory from '../../../lib/ol/source/tdt-source-factory';
import { BufferOverlayService } from '../buffer-overlay.service'
import { environment } from 'src/environments/environment';

import { Fill, Stroke, Style } from 'ol/style';
import { click } from 'ol/events/condition';
import Select from 'ol/interaction/Select';

// 天地图 token
const token = environment.common.tdt.token;
@Component({
  selector: 't216-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  public map: Map;
  private map_view;
  private tdt_img_c_layer;
  private tdt_anno_C_layer;

  private gui: GUI;
  // 选择交互工具
  private _select: Select;
  public get select() {
    return this._select
  }
  public set select(value) {
    this._select = value;
  }
  private _locationFeatureSubscription;
  private _loadFileSubscription;
  constructor(private service: BufferOverlayService) {
    this.tdt_img_c_layer = TDTLayerFactory.tdt_vec_c_layer(token);
    this.tdt_anno_C_layer = TDTLayerFactory.tdt_cva_c_layer(token);
    this._locationFeatureSubscription = this.service.locationFeature.subscribe((value) => {
      this.onLocationFeature(value);
    });
    this._loadFileSubscription = this.service.loadFile.subscribe(() => {
      this.options.editLayer = 'landuse';
    });
  }

  ngOnInit(): void {
    this.initMap();
    this.initDatGUI();

    this.map.addLayer(this.service.landuse.maplayer);
    this.map.addLayer(this.service.soil.maplayer);
    this.map.addLayer(this.service.swewers.maplayer);
    this.map.addLayer(this.service.candidate.maplayer);
  }

  ngOnDestroy(): void {
    // 移除Dat.GUI
    this.removeDatGUI();
    this._locationFeatureSubscription.unsubscribe();
    this._loadFileSubscription.unsubscribe();
  }

  private readonly options = {
    message: '天地图',
    landuse: true,
    soil: true,
    serwers: true,
    basemap: 'vector',
    candidate: true,
    editLayer: 'landuse',
    serwersBufferRadius: 300,
  };
  private initDatGUI() {
    this.gui = new GUI({ name: 'TDT' });
    this.gui.add(this.options, 'message');
    this.gui.add(this.options, 'landuse').onFinishChange((value) => {
      this.service.setLanduseDisplay(value);
    });
    this.gui.add(this.options, 'soil').onFinishChange((value) => {
      this.service.setSoilDisplay(value);
    });
    this.gui.add(this.options, 'serwers').onFinishChange((value) => {
      this.service.setSewersDisplay(value);
    });
    this.gui.add(this.options, 'candidate').onFinishChange((value) => {
      this.service.setCandidateDisplay(value);
    });
    this.gui.add(this.options, 'editLayer', ['landuse', 'soil', 'serwers', 'candidate']).onFinishChange((value) => {
      this.service.setActiveSource(value);
    });
    this.gui.add(this.options, 'serwersBufferRadius').min(1).max(500).step(1).onFinishChange((value) => {
      this.service.swewers_buffer_radius = value;
    });
    //this.gui.add(this.options, 'reset');

    // 添加dat.gui到容器
    const t = this.gui.domElement;
    document.getElementById('t216-ol-datgui').appendChild(t);
  }
  private removeDatGUI() {
    const t = this.gui.domElement;
    t.remove();
  }

  /**
   *
   * @param sid
   */
  public onLocationFeature(sid) {
    const feature = this.service.activeSource.getFeatureBySid(sid);
    this._select.getFeatures().clear();
    this._select.getFeatures().push(feature);
    const geo = feature.getGeometry();
    this.zoomToGeometry(geo);
  }

  /**
   * 定位要素
   * @param sid
   */
  public zoomToGeometry(geo) {
    if ((geo == null) || (geo == undefined)) {
      return;
    }
    this.map_view.fit(geo, { padding: [170, 170, 170, 170], minResolution: 50 });
  }

  private initMap() {
    setUserProjection('EPSG:4326');

    this.map_view = new View({
      center: [112.557405, 0.054056],
      zoom: 15,
    });
    this.map = new Map({
      target: 't216-ol-map',
      layers: [this.tdt_img_c_layer, this.tdt_anno_C_layer],
      view: this.map_view,
    });

    this._select = new Select({
      condition:click,
      style: new Style({
        stroke: new Stroke({
          color: 'red',
          width: 5,
        }),
        fill: new Fill({
          color: 'rgba(255,255,255,0.1)',
        }),
      }),
    });
  }
}

