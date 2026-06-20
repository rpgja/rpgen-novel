import type { Character } from "$lib/character";

export const sanitize = (text: string) =>
	text.replace(/#/g, "[#]").replace(/,/g, "[、]");

export const msg = (text: string) => {
	visibleMsg = true;
	return `#MSG\nm:${sanitize(text)},\n#ED`;
};

export const wait = (ms: number) => {
	visibleMsg = false;
	return `#WAIT\nt:${ms | 0},\n#ED`;
};

let selectIndex = 0;
let visibleMsg = false;
export const select = new (class {
	get options() {
		const _visibleMsg = visibleMsg;
		return (options: Record<string, string[]>) => {
			const values = Object.values(options);
			const index = selectIndex++;
			return [
				`#SEL${index}-0 x:50,y:32,c:${_visibleMsg ? 1 : 0},${Object.keys(options).map((v, i) => `i${i}:${sanitize(v)}`)},`,
				...values[0],
				...values.slice(1).flatMap((v, i) => [`#SEL${index}-${i + 1}`, ...v]),
				`#SELEND${index}`,
			].join("\n");
		};
	}
})();

export const triggers = {
	check: 0,
	touch: 1,
};
export const epoint = ({
	x,
	y,
	script,
	trigger,
}: {
	x: number;
	y: number;
	script: string | string[];
	trigger: keyof typeof triggers;
}) =>
	[
		`#EPOINT tx:${x},ty:${y},`,
		`#PH0 tm:${triggers[trigger]},`,
		...(Array.isArray(script) ? script : [script]),
		"#PHEND0",
		"#END",
	].join("\n");
export const checkEpoint = ({
	x,
	y,
	script,
}: { x: number; y: number; script: string | string[] }) =>
	epoint({ x, y, script, trigger: "check" });
export const touchEpoint = ({
	x,
	y,
	script,
}: { x: number; y: number; script: string | string[] }) =>
	epoint({ x, y, script, trigger: "touch" });

export const preloadEvent = ({
	x,
	y,
	characters,
}: { x: number; y: number; characters: Character[] }) =>
	touchEpoint({
		x,
		y,
		script: [
			"#CH_HM\nn:A1352,i:0,\n#ED",
			`#CH_SP\nn:0,tx:${x},ty:${y},l:2,\n#ED`,
			...characters
				.flatMap((v) => Object.values(v.emotions))
				.map(
					(imgur, i) =>
						`#DW_IMG\ni:${(i % 50) + 1},u:${imgur},l:7,x:100,y:0,w:1,h:1,r:0,a:1,sx:0,sy:0,sw:1,sh:1,ox:0,oy:0,\n#ED`,
				),
			"#RM_EV\n#ED",
		],
	});

export interface SceneOptions {
	id: string;
	title: string;
	synopsis: string;
	prev?: string[];
	next?: string[];
	scripts: any[];
}
export const scene = (options: SceneOptions) => {
	return options;
};
