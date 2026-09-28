export default class ValidationCException extends Error {
    public readonly validationErrors: string[];

    constructor(message: string, validationErrors?: string[]) {
        super(message);
        this.name = 'ValidationCException';
        this.validationErrors = validationErrors ?? [message];
        Object.setPrototypeOf(this, ValidationCException.prototype);
    }
}
