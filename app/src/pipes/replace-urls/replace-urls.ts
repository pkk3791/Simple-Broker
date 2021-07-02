import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "replaceUrls"
})
export class ReplaceUrlsPipe implements PipeTransform {
  /**
   * Takes a string and replaces the urls with hyperlinks.
   */
  transform(value: string, ...args) {
    for (let url of args[0]) {
      value = value.replace(
        url["url"],
        '<a href="' +
          url["expanded_url"] +
          '" target="_blank">' +
          url["display_url"] +
          "</a>"
      );
    }

    return value;
  }
}
