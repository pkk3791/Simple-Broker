import { Component, Input } from "@angular/core";
import { PhotoViewer } from "@ionic-native/photo-viewer";

@Component({
  selector: "quoted-status",
  templateUrl: "quoted-status.html"
})
export class QuotedStatusComponent {
  @Input()
  data: any[];

  constructor(private photoViewer: PhotoViewer) {}

  get hasPhoto() {
    return (
      this.data["entities"]["media"] &&
      this.data["entities"]["media"][0]["type"] == "photo"
    );
  }

  showPhoto(url: string) {
    this.photoViewer.show(url, null, { share: true });
  }
}
