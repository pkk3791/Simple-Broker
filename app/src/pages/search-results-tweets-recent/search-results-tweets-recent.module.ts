import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchResultsTweetsRecentPage } from './search-results-tweets-recent';

@NgModule({
  declarations: [
    SearchResultsTweetsRecentPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchResultsTweetsRecentPage),
  ],
})
export class SearchResultsTweetsRecentPageModule {}
