import {EventEmitter} from "node:events";

export default class EventPropagatorService {
    public static current = new EventPropagatorService();
    public eventPropagatorBus: EventEmitter;

    private constructor() {
        this.eventPropagatorBus = new EventEmitter();
    }

    public createEventPropagation<T>(event: string, value: T) {
        this.eventPropagatorBus.emit(event, value);
    }
}