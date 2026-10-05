
export default class EnvironmentValueNegativeException extends Error {
    constructor(keyName: string, wantBoilerPlate: boolean = true) {

        if(wantBoilerPlate) {
            super(`Key: ${keyName}, not found in the current environment.`);
        } else {
            super(keyName);
        }

        this.name = 'EnvironmentValueNegativeException';

        Object.setPrototypeOf(this, EnvironmentValueNegativeException.prototype);
    }

}