/**
 * 最初は速く → 後半減速
 */
const easeOut = (t: number) => t * (2 - t);

/**
 * はじめはゆっくり → 後半加速
 */
const easeIn = (t: number) => t ** 2;

/**
 * 重力加速ジャンプ：start位置 → peak → start位置へ
 */
const easeJump = (t: number) => {
	let e: number;
	if (t < 0.5) {
		// 上昇：easeOut（緩やかに上がる）
		const up = t / 0.5;
		e = 1 - (1 - up) ** 2;
	} else {
		// 落下：easeIn（加速して落ちる）
		const down = (t - 0.5) / 0.5;
		e = 1 - down ** 2;
	}
	return e;
};

const calcT = (frame: number, frames: number, count = 1) =>
	(frame / (frames / count)) % 1;

const easing = (start: number, end: number, easingRatio: number) =>
	Math.round(start + (end - start) * easingRatio);

const makeFrame = ({
	frame,
	imgur,
	y,
	opacity,
}: { frame: number; imgur: string; y: number; opacity: number }) =>
	Object.entries({
		u: imgur,
		w: 100,
		h: 100,
		sx: 0,
		sy: y,
		sw: 100,
		sh: 100,
		ox: 0,
		oy: 0,
		r: 0,
		a: opacity,
	})
		.map((v) => [`${v[0]}${frame > 1 ? frame : ""}:${v[1]}`])
		.toString();

export const fadeInCharacter = ({
	id,
	x,
	y,
	imgur,
}: { id: number; x: number; y: number; imgur: string }) =>
	`#DW_IMA\ni:${id},ms:16,l:7,x:${x},y:${y},${[...Array(8).keys()]
		.map((i) => i + 1)
		.map((frame) =>
			makeFrame({
				frame,
				imgur,
				y: easing(-16, 0, easeOut(calcT(frame, 8))),
				opacity: easing(0, 100, easeOut(calcT(frame, 8))),
			}),
		)},\n#ED`;

export const fadeOutCharacter = ({
	id,
	x,
	y,
	imgur,
}: { id: number; x: number; y: number; imgur: string }) =>
	`#DW_IMA\ni:${id},ms:16,l:7,x:${x},y:${y},${[...Array(8).keys()]
		.map((i) => i + 1)
		.map((frame) =>
			makeFrame({
				frame,
				imgur,
				y: easing(0, -16, easeOut(calcT(frame, 8))),
				opacity: easing(100, 0, easeOut(calcT(frame, 8))),
			}),
		)},\n#ED`;

export const jumpCharacter = ({
	id,
	x,
	y,
	imgur,
	count,
}: { id: number; x: number; y: number; imgur: string; count: number }) =>
	`#DW_IMA\ni:${id},ms:${16 * count},l:7,x:${x},y:${y},${[...Array(8).keys()]
		.map((i) => i + 1)
		.map((frame) =>
			makeFrame({
				frame,
				imgur,
				y: easing(0, 8, easeJump(calcT(frame, 8, count))),
				opacity: 100,
			}),
		)},\n#ED`;

export const changeCharacter = ({
	id,
	x,
	y,
	imgur,
}: { id: number; x: number; y: number; imgur: string }) =>
	`#DW_IMA\ni:${id},ms:16,l:7,x:${x},y:${y},${makeFrame({
		frame: 1,
		imgur,
		y: 0,
		opacity: 100,
	})},\n#ED`;
