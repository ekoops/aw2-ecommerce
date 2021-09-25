import ErrorType from "./ErrorType";

export class ErrorResponse {
  public type: string;
  constructor(
      type: ErrorType,
      public title: string,
      public detail?: string
  ) {
    this.type = ErrorType[type]
  }
}

export class FieldErrorReasons {
  constructor(
      public field: string,
      public reasons: string[]
  ) {
  }
}

export class FieldsValidationErrorResponse extends ErrorResponse {
  constructor(
      public invalidFields: FieldErrorReasons[],
      detail: string = "The provided request should follow the right API specification",
  ) {
    super(ErrorType.INVALID_FIELDS, "The provided fields are not valid", detail)
  }
}