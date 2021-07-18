/**
 * Created by cl-macmini-10 on 19/09/16.
 */
export class ValidationService {
  static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
    let config = {
      'required': 'This field is required.',
      'invalidCreditCard': 'Please enter a valid credit card number.',
      'invalidEmailAddress': 'Please enter a valid email address.',
      'invalidPassword': 'Please enter a valid password. Password must be at least 6 characters long, and contain a number.',
      'minlength': `This field must be ${validatorValue.requiredLength} characters long.`,
      'maxlength': `This field must be ${validatorValue.requiredLength} characters long.`,
      'min': `This field must be greater than ${validatorValue.min - 1}.`,
      'max': `This field must be less than ${validatorValue.max + 1}.`,
      'invalidPhoneNumber': 'Please enter a valid phone number.',
      'invalidZipCode': 'Please enter a valid ZIP Code.',
      'invalidVIN': 'Please enter a valid VIN.',
      'invalidWeight': 'Weight value should not exceed 250.',
      'invalidCapacity': 'Vehicle Capcity should not exceed 5500.',
      'invalidOTP': 'Please enter a valid OTP',
      'pattern': 'Invalid characters'
    };

    return config[validatorName];
  }

  static creditCardValidator(control: any) {
    // Visa, MasterCard, American Express, Diners Club, Discover, JCB
    if (control.value.match(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/)) {
      return null;
    } else {
      return { 'invalidCreditCard': true };
    }
  }

  static emailValidator(control: any) {
    // RFC 2822 compliant regex
    if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/) || control.value == "") {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  }

  static alternateEmailValidator(control: any) {
    // RFC 2822 compliant regex
    if (control.value == "") {
      return null;
    }
    else if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/) || control.value == "") {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  }

  static passwordValidator(control: any) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    // if (control.value.match(/^[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
    //     return null;
    // } else {
    //     return { 'invalidPassword': true };
    // }
  }

  static phoneNumberValidator(control: any) {
    // US Phone numbers
    if ((control.value.match(/^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i) && (control.value.length == 10)) || (control.value == "")) {
      return null;
    } else {
      return { 'invalidPhoneNumber': true };
    }
  }

  static zipCodeValidator(control: any) {
    // US Phone numbers
    if (control.value.match(/^[a-zA-Z0-9 ]*$/)) {
      return null;
    } else {
      return { 'invalidZipCode': true };
    }
  }

  static NumberValidator(control: any) {
    // Numbers
    if (control.value.match(/^[0-9 ]*$/)) {
      return null;
    } else {
      return { 'invalidOTP': true };
    }
  }
  static mobileNumberValidator(control: any) {
    // US Phone numbers
    if (control.value.match(/^[7-9]{1}[0-9]{9}$/)) {

      return null;
    } else {
      return { 'invalidPhoneNumber': true };
    }
  }
  static VINValidator(control: any) {
    // Vehicle VIN
    if (control.value.length == 17) {
      return null;
    } else {
      return { 'invalidVIN': true };
    }
  }

  static capacityValidator(control: any) {
    if (parseInt(control.value) > 5500) {
      return { 'invalidCapacity': true };
    }
    else {
      return null;
    }
  }

  static weightValidator(control: any) {
    if (parseInt(control.value) > 250) {
      return { 'invalidWeight': true };
    }
    else {
      return null;
    }
  }

  static patternValidator(control: any, pattern: RegExp) {
    if (control.value.match(pattern) || control.value == "") {
      return null;
    } else {
      return { 'invalid characters': true };
    }
  }
}
