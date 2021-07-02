import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchResultsTweetsTabsPage } from './search-results-tweets-tabs';

@NgModule({
  declarations: [
    SearchResultsTweetsTabsPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchResultsTweetsTabsPage),
  ],
})
export class SearchResultsTweetsTabsPageModule {}
