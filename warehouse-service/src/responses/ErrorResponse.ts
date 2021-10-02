import ErrorType from "./ErrorType";

export default class ErrorResponse {
  public type: string;
  constructor(
      type: ErrorType,
      public title: string,
      public detail?: string
  ) {
    this.type = ErrorType[type]
  }
}