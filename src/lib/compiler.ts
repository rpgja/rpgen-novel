import { Character } from "$lib/character";
import { select, touchEpoint, checkEpoint, preloadEvent } from "$lib/event";
import type { AppCommand, CharacterData, SceneSettings } from "$lib/store.svelte";

/**
 * タイムラインのコマンド群をRPGEN用のコード配列にコンパイルする
 */
export function compileCommands(cmds: AppCommand[], characters: CharacterData[]): string[] {
	const compiled: string[] = [];

	for (const cmd of cmds) {
		switch (cmd.type) {
			case "message": {
				// 話者がある場合は「話者「セリフ」」形式にする
				const text = cmd.speaker ? `${cmd.speaker}「${cmd.text}」` : cmd.text;
				const sanitized = text.replace(/#/g, "[#]").replace(/,/g, "[、]");
				compiled.push(`#MSG\nm:${sanitized},\n#ED`);
				break;
			}
			case "wait":
				compiled.push(`#WAIT\nt:${cmd.ms | 0},\n#ED`);
				break;

			case "character_action": {
				const charDef = characters.find((c) => c.id === cmd.charId);
				if (charDef) {
					const char = new Character({
						id: charDef.id,
						x: charDef.x,
						y: charDef.y,
						imgur: charDef.imgur,
						emotions: charDef.emotions
					});

					if (cmd.action === "fadeIn") {
						compiled.push(char.fadeIn(cmd.emotion));
					} else if (cmd.action === "fadeOut") {
						compiled.push(char.fadeOut());
					} else if (cmd.action === "change") {
						compiled.push(char.change(cmd.emotion));
					} else if (cmd.action === "jump1") {
						compiled.push(char.jump1(cmd.emotion));
					} else if (cmd.action === "jump2") {
						compiled.push(char.jump2(cmd.emotion));
					}
				}
				break;
			}

			case "select": {
				const optionsObj: Record<string, string[]> = {};
				for (const option of cmd.options) {
					optionsObj[option.label] = compileCommands(option.commands, characters);
				}
				compiled.push(select.options(optionsObj));
				break;
			}
		}
	}
	return compiled;
}

/**
 * プリロード用イベントと本体イベントを含んだ、最終的なRPGENイベントコードを生成する
 */
export function compileScene(
	settings: SceneSettings,
	characters: CharacterData[],
	commands: AppCommand[]
): string {
	const chars = characters.map((c) => new Character(c));
	
	// 1. 画像プリロードイベント (キャラクター初期位置に配置して自動でイベント消去)
	const preloadStr = preloadEvent({
		x: settings.tx,
		y: settings.ty,
		characters: chars
	});

	// 2. 本体のイベントスクリプト (決定キー起動 or 接触起動)
	const mainCmds = compileCommands(commands, characters);
	const mainEventStr = settings.trigger === "touch"
		? touchEpoint({ x: settings.tx, y: settings.ty, script: mainCmds })
		: checkEpoint({ x: settings.tx, y: settings.ty, script: mainCmds });

	return [
		`# シーン: ${settings.title} (${settings.id})`,
		`# 概要: ${settings.synopsis}`,
		`# ---------------------------------------------`,
		preloadStr,
		`# ---------------------------------------------`,
		mainEventStr
	].join("\n");
}
