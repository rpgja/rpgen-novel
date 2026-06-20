import { scene, msg, wait, select } from "./event";

scene({
	id: "opening",
	title: "収容所のはじまり",
	synopsis: "極寒の収容所で、主人公は運命の出会いを果たす。",
	prev: [],
	next: ["interrogation", "kitchen"],
	scripts: [
		msg("―1962年、マガダン州・極北の強制労働収容所。"),
		wait(1000),
		msg("運命を変える出会いは、三つの形で訪れた。"),
		wait(1000),
		select.options({
			"尋問室での出会い": [msg("尋問室に移動します。")],
			"炊事場での出会い": [msg("炊事場に移動します。")],
		}),
	],
});
