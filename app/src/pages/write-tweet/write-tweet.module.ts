import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { WriteTweetPage } from "./write-tweet";

@NgModule({
  declarations: [WriteTweetPage],
  imports: [IonicPageModule.forChild(WriteTweetPage)]
})
export class WriteTweetPageModule {}
