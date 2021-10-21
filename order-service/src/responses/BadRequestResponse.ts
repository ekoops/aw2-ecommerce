import ErrorResponse from "./ErrorResponse";
import ErrorType from "./ErrorType";

export default class BadRequestResponse extends ErrorResponse {
    constructor(
        detail?: string,
        errorType: ErrorType = ErrorType.INVALID_REQUEST,
        title: string = "the request is invalid",
    ) {
        super(errorType, title, detail);
    }
}