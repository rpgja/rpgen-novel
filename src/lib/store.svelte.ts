import { base } from "$app/paths";

// キャラクターデータ型
export interface CharacterData {
	id: number; // 1-50
	name: string;
	x: number; // 0-100
	y: number; // 0-100
	imgur: string; // 基本画像URL
	emotions: Record<string, string>; // 表情名 -> 画像URL
}

// コマンドの定義
export type CommandType = "message" | "wait" | "character_action" | "select";

export interface BaseCommand {
	id: string;
	type: CommandType;
}

export interface MessageCommand extends BaseCommand {
	type: "message";
	speaker: string;
	text: string;
}

export interface WaitCommand extends BaseCommand {
	type: "wait";
	ms: number;
}

export interface CharacterActionCommand extends BaseCommand {
	type: "character_action";
	charId: number;
	action: "fadeIn" | "fadeOut" | "change" | "jump1" | "jump2";
	emotion?: string;
}

export interface SelectOption {
	label: string;
	commands: AppCommand[];
}

export interface SelectCommand extends BaseCommand {
	type: "select";
	options: SelectOption[];
}

export type AppCommand = MessageCommand | WaitCommand | CharacterActionCommand | SelectCommand;

// シーン設定型
export interface SceneSettings {
	id: string;
	title: string;
	synopsis: string;
	tx: number; // イベントポイントTX
	ty: number; // イベントポイントTY
	trigger: "check" | "touch";
}

// プリセットキャラクター
export const PRESET_CHARACTERS: CharacterData[] = [
	{
		id: 1,
		name: "モモイ",
		x: 25,
		y: 40,
		imgur: `${base}/momoi.png`,
		emotions: {
			"通常": `${base}/momoi.png`,
			"笑顔": "https://i.imgur.com/OLpXzvs.png",
			"怒り": "https://i.imgur.com/R6oYJge.png"
		}
	},
	{
		id: 2,
		name: "ミドリ",
		x: 75,
		y: 40,
		imgur: "https://i.imgur.com/Wd713Fe.png",
		emotions: {
			"通常": "https://i.imgur.com/Wd713Fe.png",
			"笑顔": "https://i.imgur.com/vENwj1P.png",
			"呆れ": "https://i.imgur.com/Y126OqA.png"
		}
	}
];

// 初期サンプルコマンド
export const PRESET_COMMANDS: AppCommand[] = [
	{
		id: "cmd-1",
		type: "character_action",
		charId: 1,
		action: "fadeIn",
		emotion: "通常"
	},
	{
		id: "cmd-2",
		type: "message",
		speaker: "モモイ",
		text: "ついに完成したわ！私たちのビジュアルノベルエディタ「VNメモ帳」！"
	},
	{
		id: "cmd-3",
		type: "character_action",
		charId: 2,
		action: "fadeIn",
		emotion: "通常"
	},
	{
		id: "cmd-4",
		type: "message",
		speaker: "ミドリ",
		text: "そうだね、モモイ。これで誰でも簡単にノベルゲームのスクリプトを作れるようになるよ。"
	},
	{
		id: "cmd-5",
		type: "character_action",
		charId: 1,
		action: "jump1",
		emotion: "笑顔"
	},
	{
		id: "cmd-6",
		type: "message",
		speaker: "モモイ",
		text: "早速テストしてみましょう！ミドリはどっちの機能が気になる？"
	},
	{
		id: "cmd-7",
		type: "select",
		options: [
			{
				label: "キャラクターのアニメーション",
				commands: [
					{
						id: "cmd-sub-1-1",
						type: "character_action",
						charId: 1,
						action: "jump2",
						emotion: "笑顔"
					},
					{
						id: "cmd-sub-1-2",
						type: "message",
						speaker: "モモイ",
						text: "ジャンプやフェードインなど、動きのある演出が作れるのが魅力ね！"
					}
				]
			},
			{
				label: "選択肢によるストーリー分岐",
				commands: [
					{
						id: "cmd-sub-2-1",
						type: "character_action",
						charId: 2,
						action: "jump1",
						emotion: "通常"
					},
					{
						id: "cmd-sub-2-2",
						type: "message",
						speaker: "ミドリ",
						text: "ノベルゲームといえばやっぱり分岐だよね。プレイヤーの選択で展開が変わるよ。"
					}
				]
			}
		]
	},
	{
		id: "cmd-8",
		type: "message",
		speaker: "",
		text: "こうして、二人の新しい創作活動が始まったのだった。"
	}
];

class AppStore {
	characters = $state<CharacterData[]>([]);
	commands = $state<AppCommand[]>([]);
	sceneSettings = $state<SceneSettings>({
		id: "opening",
		title: "収容所のはじまり",
		synopsis: "極寒の収容所で、主人公は運命の出会いを果たす。",
		tx: 10,
		ty: 10,
		trigger: "touch"
	});

	// Undo / Redo 用の履歴スタック
	private undoStack: string[] = [];
	private redoStack: string[] = [];
	private isApplyingHistory = false;

	constructor() {
		this.reset(PRESET_CHARACTERS, PRESET_COMMANDS);
	}

	// 現在の状態をシリアライズした文字列を返す
	private serialize(): string {
		return JSON.stringify({
			characters: this.characters,
			commands: this.commands,
			sceneSettings: this.sceneSettings
		});
	}

	// 状態を復元する
	private deserialize(serialized: string) {
		const data = JSON.parse(serialized);
		this.characters = data.characters;
		this.commands = data.commands;
		this.sceneSettings = data.sceneSettings;
	}

	// 履歴を保存する
	saveHistory() {
		if (this.isApplyingHistory) return;
		const stateStr = this.serialize();
		
		// 直前の状態と同じなら保存しない
		if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === stateStr) {
			return;
		}

		this.undoStack.push(stateStr);
		if (this.undoStack.length > 50) {
			this.undoStack.shift(); // 最大50件
		}
		this.redoStack = []; // 新しい操作をしたらRedoはクリア
	}

	undo() {
		if (this.undoStack.length <= 1) return; // 現在の状態を含めて1件以下ならUndo不可
		this.isApplyingHistory = true;
		
		const current = this.undoStack.pop()!;
		this.redoStack.push(current);
		
		const prev = this.undoStack[this.undoStack.length - 1];
		this.deserialize(prev);
		
		this.isApplyingHistory = false;
	}

	redo() {
		if (this.redoStack.length === 0) return;
		this.isApplyingHistory = true;
		
		const next = this.redoStack.pop()!;
		this.undoStack.push(next);
		this.deserialize(next);
		
		this.isApplyingHistory = false;
	}

	get canUndo() {
		return this.undoStack.length > 1;
	}

	get canRedo() {
		return this.redoStack.length > 0;
	}

	// データをリセットする
	reset(presetChars?: CharacterData[], presetCommands?: AppCommand[]) {
		this.characters = presetChars ? JSON.parse(JSON.stringify(presetChars)) : [];
		this.commands = presetCommands ? JSON.parse(JSON.stringify(presetCommands)) : [];
		this.sceneSettings = {
			id: "scene_1",
			title: "新しいシーン",
			synopsis: "ここにシーンの概要を記述します。",
			tx: 10,
			ty: 10,
			trigger: "touch"
		};
		this.undoStack = [];
		this.redoStack = [];
		this.saveHistory();
	}

	// JSONデータから状態を完全にインポートする
	importJson(jsonStr: string): boolean {
		try {
			const data = JSON.parse(jsonStr);
			if (data.characters && data.commands && data.sceneSettings) {
				this.characters = data.characters;
				this.commands = data.commands;
				this.sceneSettings = data.sceneSettings;
				this.undoStack = [];
				this.redoStack = [];
				this.saveHistory();
				return true;
			}
		} catch (e) {
			console.error("Failed to import JSON", e);
		}
		return false;
	}

	// JSONデータをエクスポートする
	exportJson(): string {
		return this.serialize();
	}
}

export const store = new AppStore();
