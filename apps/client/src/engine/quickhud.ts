interface ElementCreator {
	withClass(name: string): ElementCreator,
	withClasses(classes: string[]): ElementCreator,
	withId(name: string): ElementCreator,
	withAttribute(name: string, value: string): ElementCreator,
	withAttributes(attributes: Record<string, string>): ElementCreator,
	withStyle(name: Extract<keyof CSSStyleDeclaration, string>, value: string): ElementCreator,
	withStyles(styles: Partial<Record<Extract<keyof CSSStyleDeclaration, string>, string>>): ElementCreator,
	withHtml(html: string): ElementCreator,
	withText(text: string): ElementCreator,
	appendChild(child: HTMLElement): ElementCreator,
	appendChildren(children: HTMLElement[]): ElementCreator,
	addToParent(parent: HTMLElement): ElementCreator,
	on<K extends keyof HTMLElementEventMap>(type: K, listener: (event: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): ElementCreator,
	ok(): HTMLElement,
}

function createElement<K extends keyof HTMLElementTagNameMap>(element: K): ElementCreator {
	let elem = document.createElement(element);

	return {
		withClass(name) { elem.classList.add(name); return this; },
		withClasses(classes) { classes.forEach(c => elem.classList.add(c)); return this; },
		withId(name) { elem.id = name; return this; },
		withAttribute(name, value) { elem.setAttribute(name, value); return this; },
		withAttributes(attributes) { Object.entries(attributes).forEach(([key, val]) => elem.setAttribute(key, val)); return this; },
		withStyle(name, value) { (elem.style as any)[name] = value; return this; },
		withStyles(styles) { Object.entries(styles).forEach(([key, val]) => elem.style[key] = val); return this; },
		withHtml(html) { elem.innerHTML = html; return this; },
		withText(text) { elem.innerText = text; return this; },
		appendChild(child) { elem.appendChild(child); return this; },
		appendChildren(children) { children.forEach(e => elem.appendChild(e)); return this; },
		addToParent(parent) { parent.appendChild(elem); return this; },
		on(type, listener, options) { elem.addEventListener(type, listener as EventListener, options); return this; },
		ok() { return elem; },
	}
}

function injectStyles() {
	if (document.getElementById("qh-styles")) return;
	const css = `
		.qh-wrapper {
				position: absolute;
				background: rgba(20, 20, 30, 0.9);
				backdrop-filter: blur(10px);
				border-radius: 8px;
				font-family: 'Segoe UI', monospace;
				color: white;
				z-index: 9999;
				min-width: 240px;
				box-shadow: 0 8px 20px rgba(0,0,0,0.4);
				border: 1px solid rgba(255,255,255,0.1);
				user-select: none;
		}
		.qh-top-right { top: 20px; right: 20px; }
		.qh-top-left { top: 20px; left: 20px; }
		.qh-bottom-right { bottom: 20px; right: 20px; }

		.qh-header {
				padding: 12px 15px;
				background: rgba(255,255,255,0.05);
				border-bottom: 1px solid rgba(255,255,255,0.1);
				cursor: pointer;
				display: flex;
				justify-content: space-between;
				align-items: center;
				border-radius: 8px 8px 0 0;
				font-weight: bold;
				letter-spacing: 1px;
		}
		.qh-header:hover { background: rgba(255,255,255,0.1); }

		.qh-toggle { transition: 0.2s; }

		.qh-content {
				padding: 15px;
				display: flex;
				flex-direction: column;
				gap: 12px;
		}

		.qh-row { display: flex; flex-direction: column; gap: 6px; }

		.qh-label-row {
				display: flex;
				justify-content: space-between;
				font-size: 12px;
				color: #aaa;
		}

		/* Inputs */
		.qh-slider { width: 100%; cursor: pointer; accent-color: #4a90e2; }

		.qh-select {
				width: 100%;
				background: #333;
				color: white;
				border: 1px solid #555;
				padding: 5px;
				border-radius: 4px;
				cursor: pointer;
		}

		.qh-color-input {
				width: 100%;
				height: 30px;
				border: none;
				cursor: pointer;
				background: none;
		}

		.qh-button {
				background: #4a90e2;
				border: none;
				color: white;
				padding: 8px;
				border-radius: 4px;
				cursor: pointer;
				font-weight: bold;
				text-align: center;
				transition: 0.2s;
		}
		.qh-button:hover { background: #357abd; transform: translateY(-1px); }

		/* Folders */
		.qh-folder {
				border-left: 2px solid #444;
				padding-left: 10px;
				margin-top: 5px;
		}
		.qh-folder-header {
				font-size: 13px;
				color: #ddd;
				cursor: pointer;
				margin-bottom: 8px;
				font-weight: bold;
				display: flex;
				align-items: center;
				gap: 5px;
		}
		.qh-folder-header::before { content: '▸'; display: inline-block; transition: 0.2s; }
		.qh-folder.open .qh-folder-header::before { transform: rotate(90deg); }
		.qh-folder-content { display: none; flex-direction: column; gap: 10px; }
		.qh-folder.open .qh-folder-content { display: flex; }
	`;

	createElement('style')
		.withHtml(css)
		.withId("qh-styles")
		.addToParent(document.head);
}

export enum HUDPosition {
	TopRight    = "top-right",
	BottomRight = "bottom-right",
	TopLeft     = "top-left",
	BottomLeft  = "top-left",
}

interface QuickHUDFolder {
    addRange(label: string, min: number, max: number, value: number, step: number, callback: (value: number) => void): QuickHUDFolder;
    addSelect(label: string, options: string[] | Record<string, string>, selectedValue: string, callback: (value: string) => void): QuickHUDFolder;
    addButton(label: string, callback: () => void): QuickHUDFolder;
    addLabeledValue(label: string, initialValue: any): { update: (val: any) => void, folder: QuickHUDFolder };
    addFolder(title: string): QuickHUDFolder; 
    parent(): QuickHUD | QuickHUDFolder; 
}

export class QuickHUD {
	private header: HTMLDivElement;
	private content: HTMLDivElement;
	private wrapper: HTMLDivElement;
	private toggleEl: HTMLSpanElement;

	private isOpen: boolean = true;
	private hasDragged: boolean = false;
	private isDraggable: boolean = false;

	constructor(title = "QuickHUD", position: HUDPosition = HUDPosition.TopRight) {
		injectStyles();

		this.toggleEl = createElement("span")
			.withClass("qh-toggle")
			.withText("▼")
			.ok();

		this.header = createElement("div")
			.withClass("qh-header")
			.appendChild(createElement("span").withClass("qh-title").withText(title).ok())
			.appendChild(this.toggleEl)
			.ok() as HTMLDivElement;

		this.content = createElement("div")
			.withClass("qh-content")
			.ok() as HTMLDivElement;

		this.wrapper = createElement("div")
			.withClass("qh-wrapper")
			.withClass(`qh-${position}`)
			.appendChild(this.header)
			.appendChild(this.content)
			.addToParent(document.body)
			.ok() as HTMLDivElement;

		this.initDragAndToggle();
	}

	toggle(force?: boolean) {
		this.isOpen = force !== undefined ? force : !this.isOpen;

		this.content.style.display = this.isOpen ? "flex" : "none";
		this.toggleEl.style.transform = this.isOpen ? "rotate(0deg)" : "rotate(-90deg)";
	}

	setDraggable(enabled: boolean): QuickHUD {
		this.isDraggable = enabled;
		this.header.style.cursor = enabled ? "grab" : "default";

		if (enabled) {
			this.header.setAttribute("title", "Drag to move, click to toggle");
		} else {
			this.header.removeAttribute("title");
		}
		return this;
	}

	private initDragAndToggle() {
		let startX = 0, startY = 0;
		let initialLeft = 0, initialTop = 0;
		const THRESHOLD = 3;

		this.header.addEventListener('click', _ => {
			if (this.hasDragged) {
					this.hasDragged = false;
					return;
			}
			this.toggle();
		});

		this.header.addEventListener('pointerdown', (e) => {
			if (!this.isDraggable) return;

			if (e.button != 0) return;

			this.header.setPointerCapture(e.pointerId);
			this.header.style.cursor = 'grabbing';
			this.hasDragged = false; 
			
			startX = e.clientX;
			startY = e.clientY;

			const rect = this.wrapper.getBoundingClientRect();
			initialLeft = rect.left;
			initialTop = rect.top;

			this.wrapper.style.right = 'auto';
			this.wrapper.style.bottom = 'auto';
			this.wrapper.style.left = `${initialLeft}px`;
			this.wrapper.style.top = `${initialTop}px`;
		});

		this.header.addEventListener('pointermove', (e) => {
			if (!this.isDraggable || !this.header.hasPointerCapture(e.pointerId)) return;

			const dx = e.clientX - startX;
			const dy = e.clientY - startY;

			if (Math.hypot(dx, dy) < THRESHOLD) return;
			this.hasDragged = true;
			this.wrapper.style.left = `${initialLeft + dx}px`;
			this.wrapper.style.top = `${initialTop + dy}px`;
		});

		this.header.addEventListener('pointerup', (e) => {
			if (!this.isDraggable) return;
			this.header.releasePointerCapture(e.pointerId);
			this.header.style.cursor = 'grab';
		});
	}

	private createRow(parent: HTMLElement, children: HTMLElement[]): HTMLDivElement {
		return createElement("div")
			.withClass("qh-row")
			.appendChildren(children)
			.addToParent(parent)
			.ok() as HTMLDivElement;
	}

	addRange(
		label: string,
		min: number, max: number,
		value: number, step: number,
		callback: (value: number) => void,
		parent: HTMLElement = this.content
	): this {
		const valLabel = createElement("span")
			.withText(value.toFixed(step < 1 ? 2 : 0))
		  .ok();

		const labelRow = createElement("div")
			.withClass("qh-label-row")
			.appendChild(createElement("span").withText(label).ok())
			.appendChild(valLabel)
			.ok();

		const input = createElement("input")
			.withClass("qh-slider")
			.withAttribute("type", "range")
			.withAttribute("min", min.toString())
			.withAttribute("max", max.toString())
			.withAttribute("step", step.toString())
			.withAttribute("value", value.toString())
			.on("input", e => {
				const target = e.target as HTMLInputElement;
				const val = parseFloat(target.value);
				valLabel.innerText = val.toFixed(step < 1 ? 2 : 0);
				callback(val);
			})
			.ok() as HTMLInputElement;

		this.createRow(parent, [labelRow, input]);
		return this;
	}

	addSelect(
		label: string,
		options: string[] | Record<string, string>,
		selectedValue: string,
		callback: (value: string) => void,
		parent: HTMLElement = this.content
	): this {
		const labelRow = createElement("div")
			.withClass("qh-label-row")
			.withText(label)
			.ok();

		let optionsElems: HTMLOptionElement[] = [];

		if (Array.isArray(options)) {
			options.forEach(opt => {
				const el = createElement("option")
					.withText(opt)
					.withAttribute("value", opt)
					.ok() as HTMLOptionElement;
				optionsElems.push(el);	
			});
		} else {
			Object.entries(options).forEach(([key, val]) => {
				const el = createElement("option")
					.withText(key)
					.withAttribute("value", val)
					.ok() as HTMLOptionElement;
				optionsElems.push(el);
			});
		}

		const select = createElement("select")
			.withClass("qh-select")
			.appendChildren(optionsElems)
			.on("change", (e) => {
				const target = e.target as HTMLSelectElement;
				callback(target.value);
			})
			.withAttribute("value", selectedValue)
			.ok() as HTMLInputElement;

		this.createRow(parent, [labelRow, select]);
		return this;
	}

	addButton(
		label: string,
		callback: () => void,
		parent: HTMLElement = this.content
	): this {
		createElement("button")
			.withText(label)
			.withClass("qh-button")
			.on("click", callback)
			.addToParent(parent)
			.ok();

		return this;
	}

	addLabeledValue<T>(
		label: string,
		initialValue: T,
		parent: HTMLElement = this.content
	): (value: any) => void {
		const valueSpan = createElement("span")
			.withText(String(initialValue))
			.withStyle("color", "#fff")
			.ok();

		const row = createElement("div")
			.withClass("qh-label-row")
			.appendChild(createElement("span").withText(label).ok())
			.appendChild(valueSpan)
			.ok();

		this.createRow(parent, [row]);

		return (newValue: T) => {
			valueSpan.innerText = String(newValue);
		}
	}

	addFolder(title: string): QuickHUDFolder {
		return this.createFolder(title, this.content, this);
	}

	private createFolder(title: string, parentEl: HTMLElement, parentObj: QuickHUD | QuickHUDFolder): QuickHUDFolder {
		const header = createElement("div")
			.withText(title)
			.withClass("qh-folder-header")
			.ok();

		const content = createElement("div")
			.withClass("qh-folder-content")
			.ok();

		const folderEl = createElement("div")
			.withClass("qh-folder")
			.appendChild(header)
			.appendChild(content)
			.addToParent(parentEl)
			.ok();

		header.addEventListener("click", e => {
			e.stopPropagation();
			folderEl.classList.toggle("open");
		});

		const folder: QuickHUDFolder = {
			addRange: (l, min, max, v, s, cb) => {
				this.addRange(l, min, max, v, s, cb, content);
				return folder;
			},
			addSelect: (l, opts, v, cb) => {
				this.addSelect(l, opts, v, cb, content);
				return folder;
			},
			addButton: (l, cb) => {
				this.addButton(l, cb, content);
				return folder;
			},
			addLabeledValue: (l, v) => {
				const update = this.addLabeledValue(l, v, content);
				return { update, folder };
			},
			addFolder: (t) => {
				return this.createFolder(t, content, folder);
			},
			parent: () => parentObj
		}
		return folder;
	}
}

