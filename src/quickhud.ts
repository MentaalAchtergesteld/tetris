interface ElementCreator {
	withClass(name: string): ElementCreator,
	withClasses(classes: string[]): ElementCreator,
	withId(name: string): ElementCreator,
	withAttribute(name: string, value: string): ElementCreator,
	withAttributes(attributes: { string: string }): ElementCreator,
	withStyle(name: string, value: CSSStyleDeclaration): ElementCreator,
	withStyles(styles: { string: CSSStyleDeclaration }): ElementCreator,
	withHtml(html: string): ElementCreator,
	withText(text: string): ElementCreator,
	appendChild(child: HTMLElement): ElementCreator,
	appendChildren(children: HTMLElement[]): ElementCreator,
	addToParent(parent: HTMLElement): ElementCreator,
	ok(): HTMLElement,
}

function createElement(element: string): ElementCreator {
	let elem = document.createElement(element);

	return {
		withClass(name) { elem.classList.add(name); return this; },
		withClasses(classes) { classes.forEach(c => elem.classList.add(c)); return this; },
		withId(name) { elem.id = name; return this; },
		withAttribute(name, value) { elem.setAttribute(name, value); return this; },
		withAttributes(attributes) { Object.entries(attributes).forEach(a => elem.setAttribute(a[0], a[1])); return this; },
		withStyle(name, value) { elem.style[name] = value; return this; },
		withStyles(styles) { Object.entries(styles).forEach(s => elem.style[s[0]] = s[1]); return this; },
		withHtml(html) { elem.innerHTML = html; return this; },
		withText(text) { elem.innerText = text; return this; },
		appendChild(child) { elem.appendChild(child); return this; },
		appendChildren(children) { children.forEach(e => elem.appendChild(e)); return this; },
		addToParent(parent) { parent.appendChild(elem); return this; },
		ok() { return elem; },
	}
}

function injectStyles() {
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
		.withText(css)
		.withId("qh-styles")
		.addToParent(document.head);
}

export class QuickHUD {
	private header: HTMLDivElement;
	private content: HTMLDivElement;
	private wrapper: HTMLDivElement;
	private toggleEl: HTMLSpanElement;

	private isOpen: boolean;
	private hasDragged: boolean;
	private draggable: boolean;

	constructor(title = "QuickHUD", position = "top-right") {
		this.toggleEl = createElement("span").withClass("qh-toggle").withText("▼").ok();

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

		this.isOpen = true;
		this.hasDragged = false;
		this.draggable = false;
		this.initDragAndToggle();

		if (!document.getElementById("quick-hud-styles")) injectStyles();
	}

	toggle() {
		this.isOpen = !this.isOpen;

		this.content.style.display = this.isOpen ? "flex" : "none";
		this.toggleEl.style.transform = this.isOpen ? "rotate(0deg)" : "rotate(-90deg)";
	}

	initDragAndToggle() {
		let startX: number, startY: number;
		let initialLeft: number, initialTop: number;
		const THRESHOLD = 5;

		this.header.addEventListener('click', _ => {
			if (this.hasDragged) {
					this.hasDragged = false;
					return;
			}

			this.isOpen = !this.isOpen;
			this.content.style.display = this.isOpen ? 'flex' : 'none';
		});

		this.header.addEventListener('pointerdown', (e) => {
			if (!this.draggable) return;
			this.header.setPointerCapture(e.pointerId);
			this.header.style.cursor = 'grabbing';

			this.hasDragged = false; 
			
			startX = e.clientX;
			startY = e.clientY;

			const rect = this.wrapper.getBoundingClientRect();
			initialLeft = rect.left;
			initialTop = rect.top;

			this.wrapper.style.right = 'auto';
			this.wrapper.style.left = initialLeft + 'px';
			this.wrapper.style.top = initialTop + 'px';
		});

		this.header.addEventListener('pointermove', (e) => {
			if (!this.header.hasPointerCapture(e.pointerId)) return;

			const dx = e.clientX - startX;
			const dy = e.clientY - startY;

			if (Math.hypot(dx, dy) > THRESHOLD) this.hasDragged = true;

			if (!this.hasDragged) return
			this.wrapper.style.left = (initialLeft + dx) + 'px';
			this.wrapper.style.top = (initialTop + dy) + 'px';
		});

		this.header.addEventListener('pointerup', (e) => {
			this.header.releasePointerCapture(e.pointerId);
			this.header.style.cursor = 'grab';
		});
	}

	setDraggable(enabled: boolean) {
		this.draggable = enabled;
		this.header.style.cursor = enabled ? "grab" : "default";

		if (enabled) {
			this.header.setAttribute("title", "Drag me!");
		} else {
			this.header.removeAttribute("title");
		}

		return this;
	}

	createRow(parent: HTMLElement, children: HTMLElement[]) {
		return createElement("div")
			.withClass("qh-row")
			.appendChildren(children)
			.addToParent(parent)
			.ok();
	}

	addRange(
		label: string,
		min: number, max: number,
		value: number, step: number,
		callback: (value: number) => void,
		parent: HTMLElement = this.content) {
		const valLabel = createElement("span")
			.withText(String(value))
			.withId(`val-${label}`)
		  .ok();

		const labelRow = createElement("div")
			.withClass("qh-label-row")
			.appendChild(createElement("span").withText(label).ok())
			.appendChild(valLabel)
			.ok();

		const input = createElement("input")
			.withClass("qh-slider")
			.withAttribute("type", "range")
			.withAttribute("min", String(min))
			.withAttribute("max", String(max))
			.withAttribute("step", String(step))
			.withAttribute("value", String(value))
			.ok() as HTMLInputElement;

		this.createRow(parent, [labelRow, input]);

		input.addEventListener("input", _ => {
			const val = parseFloat(input.value);
			valLabel.innerText = val.toFixed(step < 1 ? 2 : 0);
			callback(val);
		});

		return this;
	}

	addSelect(
		label: string,
		options: string[] | { string: string }, selectedValue: string,
		callback: (value: string) => void,
		parent: HTMLElement = this.content) {
		const labelRow = createElement("div")
			.withClass("qh-label-row")
			.withText(label)
			.ok();

		let optionsElems: HTMLElement[] = [];
		if (Array.isArray(options)) {
			options.forEach(opt => {
				const el = createElement("option")
					.withText(opt)
					.withAttribute("value", opt)
					.withAttribute("selected", String(opt == selectedValue))
					.ok();
				optionsElems.push(el);	
			});
		} else {
			Object.entries(options).forEach(([key, val]) => {
				const el = createElement("option")
					.withText(key)
					.withAttribute("value", val)
					.withAttribute("selected", String(val == selectedValue))
					.ok();
				optionsElems.push(el);
			});
		}

		const select = createElement("select")
			.withClass("qh-select")
			.appendChildren(optionsElems)
			.ok() as HTMLInputElement;

		this.createRow(parent, [labelRow, select]);

		select.addEventListener("change", _ => callback(select.value));

		return this;
	}

	addButton(label: string, callback: () => void, parent: HTMLElement = this.content) {
		const btn = createElement("button")
			.withText(label)
			.withClass("qh-button")
			.addToParent(parent)
			.ok();

		btn.addEventListener("click", callback);
	}

	addFolder(title: string) {
		const header = createElement("div")
			.withText(title)
			.withClass("qh-folder-header")
			.ok();
	
		const content = createElement("div")
			.withClass("qh-folder-content")
			.ok();

		const folder = createElement("div")
			.withClass("qh-folder")
			.appendChild(header)
			.appendChild(content)
			.addToParent(this.content)
			.ok();

		header.addEventListener("click", _ => folder.classList.toggle("open"));

		return this.folderResult(this, content);
	}

	folderResult(parent: QuickHUD, content: HTMLElement) {
		return {
			addRange: (l: string, min: number, max: number, v: number, s: number, cb: (value: number) => void) => { this.addRange(l, min, max, v, s, cb, content); return this.folderResult(parent, content) },
			addSelect: (l: string, opts: string[] | { string: string }, v: string, cb: (value: string) => void) => { this.addSelect(l, opts, v, cb, content); return this.folderResult(parent, content); },
			addButton: (l: string, cb: () => void) => { this.addButton(l, cb, content); return this.folderResult(parent, content); },
			ok : () => parent,
		}
	}
}
