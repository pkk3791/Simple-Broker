import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "friendlyNumber"
})
export class FriendlyNumberPipe implements PipeTransform {
  /**
   * Takes a number and formats it using binary prefixes
   */
  transform(value: number, ...args) {
    if (value > 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value > 1000) {
      return (value / 1000).toFixed(1) + "k";
    } else {
      return value;
    }
  }
}
