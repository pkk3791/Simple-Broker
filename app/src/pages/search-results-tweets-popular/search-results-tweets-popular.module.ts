import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchResultsTweetsPopularPage } from './search-results-tweets-popular';

@NgModule({
  declarations: [
    SearchResultsTweetsPopularPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchResultsTweetsPopularPage),
  ],
})
export class SearchResultsTweetsPopularPageModule {}
