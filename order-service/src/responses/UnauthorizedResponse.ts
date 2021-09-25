import { ErrorResponse } from "./ErrorResponse";
import ErrorType from "./ErrorType";

export default class UnauthorizedResponse extends ErrorResponse {
    constructor() {
        super(
            ErrorType.UNAUTHORIZED,
            "unauthorized action",
            "you are not authorized to perform the requested action"
        );
    }
}
