import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "replaceHashtags"
})
export class ReplaceHashtagsPipe implements PipeTransform {
  /**
   * Takes a string and highlights the hashtags.
   */
  transform(value: string, ...args) {
    for (let hashtag of args[0]) {
      value = value.replace(
        "#" + hashtag.text,
        '<span class="hashtag">#' + hashtag.text + "</span>"
      );
    }

    return value;
  }
}
