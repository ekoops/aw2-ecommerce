import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class RouteNotFoundResponse extends ErrorResponse {
    constructor() {
        super(
            ErrorType.ROUTE_NOT_FOUND,
            "route not found"
        );
    }
}
