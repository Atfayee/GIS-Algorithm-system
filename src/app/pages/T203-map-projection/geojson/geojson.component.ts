import { Component, OnInit } from '@angular/core';
import { MapProjectionService } from '../map-projection.service';

@Component({
  selector: 't203-geojson',
  templateUrl: './geojson.component.html',
  styleUrls: ['./geojson.component.scss']
})
export class GeoJsonComponent implements OnInit {

  /**
   *
   */
   public get code() {
    return this.service.displaySource.geojson_string;
  };
  public set code(value) {
    this.service.displaySource.geojson_string = value;
  }

  constructor(private service:MapProjectionService) { }

  ngOnInit(): void {
  }

}
