import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class InternalServerErrorResponse extends ErrorResponse {
    constructor() {
        super(
            ErrorType.INTERNAL_ERROR,
            "an internal server error occurred",
            "this is a generic internal server error response"
        );
    }
}
