import { NgModule } from "@angular/core";
import { FriendlyNumberPipe } from "./friendly-number/friendly-number";
import { DiffForHumansPipe } from "./diff-for-humans/diff-for-humans";
import { ReplaceUrlsPipe } from "./replace-urls/replace-urls";
import { ReplaceHashtagsPipe } from "./replace-hashtags/replace-hashtags";
import { HighResolutionPipe } from './high-resolution/high-resolution';
@NgModule({
  declarations: [
    FriendlyNumberPipe,
    DiffForHumansPipe,
    ReplaceUrlsPipe,
    ReplaceHashtagsPipe,
    HighResolutionPipe
  ],
  imports: [],
  exports: [
    FriendlyNumberPipe,
    DiffForHumansPipe,
    ReplaceUrlsPipe,
    ReplaceHashtagsPipe,
    HighResolutionPipe
  ]
})
export class PipesModule {}
