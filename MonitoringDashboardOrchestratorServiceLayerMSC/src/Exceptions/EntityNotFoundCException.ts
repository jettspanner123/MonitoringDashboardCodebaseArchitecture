export default class EntityNotFoundCException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EntityNotFoundCException';
        Object.setPrototypeOf(this, EntityNotFoundCException.prototype);
    }
}
