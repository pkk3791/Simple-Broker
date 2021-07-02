import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SearchResultsUsersPage } from './search-results-users';

@NgModule({
  declarations: [
    SearchResultsUsersPage,
  ],
  imports: [
    IonicPageModule.forChild(SearchResultsUsersPage),
  ],
})
export class SearchResultsUsersPageModule {}
