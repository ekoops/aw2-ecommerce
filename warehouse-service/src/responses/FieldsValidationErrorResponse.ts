import ErrorType from "./ErrorType";
import BadRequestResponse from "./BadRequestResponse";

export class FieldErrorReasons {
    constructor(
        public field: string,
        public reasons: string[]
    ) {
    }
}

export default class FieldsValidationErrorResponse extends BadRequestResponse {
    constructor(
        public invalidFields: FieldErrorReasons[],
        detail: string = "The provided request should follow the right API specification",
    ) {
        super(detail, ErrorType.INVALID_FIELDS, "The provided fields are not valid")
    }

    public code: number = 0;
}