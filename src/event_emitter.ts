type Listener<T> = (data: T) => void;

export class EventEmitter<EventMap extends Record<string, any> = Record<string, any>> {
	private listeners: { [K in keyof EventMap]?: Listener<EventMap[K]>[] } = {};

	on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event].push(listener);
		return () => this.off(event, listener);
	}

	once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
		const wrapper = (data: EventMap[K]) => {
			this.off(event, wrapper);
			listener(data);
		}
		return this.on(event, wrapper);
	}

	off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
		if (!this.listeners[event]) return;
		this.listeners[event] = this.listeners[event].filter(l => l !== listener);
	}

	emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
		if (!this.listeners[event]) return;
		this.listeners[event].forEach(l => l(data));
	}

	clear(): void {
		this.listeners = {};
	}
}
