import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "highResolution"
})
export class HighResolutionPipe implements PipeTransform {
  /**
   * Takes a profile img URL string and removes "normal" from the URL to receive a high resolution image
   */
  transform(value: string, ...args) {
    if (value) {
      return value.replace("_normal", "_400x400");
    }
  }
}
