import {
  Component,
  Input,
  Output,
  ChangeDetectionStrategy,
  EventEmitter
} from "@angular/core";
import { Refresher } from "ionic-angular";

@Component({
  selector: "feed",
  templateUrl: "feed.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedComponent {
  @Input()
  data: any[];
  @Input()
  enableRefresh: boolean = true;
  @Input()
  enableInfiniteScroll: boolean = true;
  @Output()
  onRefresh: EventEmitter < any > = new EventEmitter < any > ();
  @Output()
  onLoadMore: EventEmitter < any > = new EventEmitter < any > ();

  constructor() {}

  doRefresh(refresher: Refresher) {
    this.onRefresh.emit(refresher);
  }

  doInfinite(infiniteScroll) {
    this.onLoadMore.emit(infiniteScroll);
  }
}
