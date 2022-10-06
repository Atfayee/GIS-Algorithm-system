import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BufferOverlayService } from './buffer-overlay.service';

@Component({
  selector: 't216-buffer-overlay',
  templateUrl: './buffer-overlay.component.html',
  styleUrls: ['./buffer-overlay.component.scss']
})
export class BufferOverlayComponent implements OnInit {

  public title = environment.t216_buffer_overlay.title;

  constructor(private service: BufferOverlayService) { }

  ngOnInit(): void {
  }

  public onOpenClick() {
    this.service.downloadFile();
  }

  public onSaveClick() {
    const filename = this.service.createFileName();
    this.service.saveFile(filename);
  }


  public onOverlayClick() {
    this.service.overlayer();
  }

}
