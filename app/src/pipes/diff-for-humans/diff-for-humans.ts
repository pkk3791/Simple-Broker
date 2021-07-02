import { Pipe, PipeTransform } from "@angular/core";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.locale(en);
const timeAgo = new TimeAgo("en-US");

@Pipe({
  name: "diffForHumans"
})
export class DiffForHumansPipe implements PipeTransform {
  /**
   * Takes a timestamp and makes the diff readable for humans.
   */
  transform(value: string, ...args) {
    return timeAgo.format(new Date(value), "twitter");
  }
}
