import {Pipe, PipeTransform} from "@angular/core";
import {timsort} from "timsort"

declare var require: any;

@Pipe({name: 'keys', pure: true})
export class KeysPipe implements PipeTransform {
  transform(value: any, args: any[] = null): any {
    if (!value) return [];
    let keys = Object.keys(value);
    return keys;
  }
}


@Pipe({
  name: 'url_phone'
})
export class UrlPhonePipe implements PipeTransform {

  transform(text: string, args?: string): any {
    try {
      if (typeof text !== 'string') {
        return text;
      }
      if (text.indexOf('sheet_apple_64_indexed_128.png') > -1) {
        return text;
      }
      // const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlRegex = /(((https?\:\/\/)|(www\.))(\S([^<\n\s])+))/g;
      const url_arr: Array<any> = text.match(urlRegex);
      if (url_arr) {
        url_arr.forEach((element, index) => {
          text = text.replace(element, function (url) {
            // return '<a href="' + url + '">' + url + '</a>';
            return '$a_' + index;
          });
        });

      }
      // go for phone number checks
      text = this.phoneNumber(text);
      if (url_arr) {
        url_arr.forEach((element, index) => {
          let href = element;
          if (href.indexOf('http') < 0 && href.indexOf('https') < 0) {
            href = href.replace('www', 'http://www');
          }
          const s = '$a_' + index;
          const re = new RegExp(s, 'g');
          text = text.replace(s, function (url) {
            return `<a target="_blank" href="${href}" class="link-color">${element}</a>`;
          });
        });
      }
      return text.replace(/\n/g, '<br/>');
    } catch (e) {
      console.log(e);
      return text;
    }
  }

  phoneNumber(text: string): string {
    try {
      if (typeof text !== 'string') {
        return text;
      }
      // var exp = /(\+?(?:(?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)|\((?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\))[0-9. -]{4,14})(?:\b|x\d+)/ig;
      // var exp = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ig;
      // var exp = /\+?[1-9]{1}[0-9]{9,14}/g
      const exp = /([+]?\d{1,2}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/g;
      return text.replace(exp, '<a href=\'tel:$&\'>$&</a>');
    } catch (e) {
      console.log(e);
      return text;
    }
  }
}







      @Pipe({name: 'orderBy', pure: true})
      export class OrderByPipe implements PipeTransform {
        TimSort = require("timsort");

        transform(value: any, args: any[] = null): any {
          if (!value) return;
          let a = [];
          value.forEach(element => {
            a.push(args[element]);
          });
          this.TimSort.sort(a, this.Compare);
          return a;
        }

        Compare(a: any, b: any) {
          if (a.channel_id == b.channel_id) {
            let x = a.channel_priority;
            let y = b.channel_priority;
            return x - y;
          }
          let d1: any = new Date(a.date_time);
          let d2: any = new Date(b.date_time)
          return (d2 - d1);
        }
      }

      @Pipe({name: 'datetime', pure: true})
      export class DateTimePipe implements PipeTransform {
        MMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        transform(value: string, args: any[] = null): any {
          let inputDate = new Date(value);
          let currentDate = new Date();
          let currentYear = currentDate.getFullYear();
          let currentMonth = currentDate.getMonth();
          let currentD = currentDate.getDate();

          if (inputDate.getFullYear() == currentDate.getFullYear()) {
            if (inputDate.getMonth() == currentDate.getMonth()) {
              if (inputDate.getDate() == currentDate.getDate()) {
                let hours = inputDate.getHours();
                let minutes: any = inputDate.getMinutes();
                let ampm = hours >= 12 ? 'pm' : 'am';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                var strTime = hours + ':' + minutes + ' ' + ampm;
                return strTime;
              }
            }
          }
          return inputDate.getDate() + " " + this.MMM[inputDate.getMonth()];

        }
      }
