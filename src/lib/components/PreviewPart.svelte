<script lang="ts">
	import { store, type AppCommand, type CharacterData, type SelectOption } from "$lib/store.svelte";
	import { PlayIcon, SquareIcon, ChevronRightIcon } from "@lucide/svelte";
	import { onDestroy } from "svelte";

	// プレビュー中の一時的なキャラクター状態
	interface ActiveCharState {
		id: number;
		name: string;
		x: number;
		y: number;
		imageUrl: string;
		visible: boolean;
		opacity: number;
		isJumping: boolean;
		jumpType: "jump1" | "jump2" | null;
	}

	// 実行コンテキスト（コールスタック用）
	interface ExecutionContext {
		commands: AppCommand[];
		index: number;
	}

	let isPlaying = $state(false);
	let messageSpeaker = $state("");
	let messageText = $state("");
	let showMessageWindow = $state(false);
	let activeCharacters = $state<Record<number, ActiveCharState>>({});
	let selectChoices = $state<SelectOption[]>([]);
	
	let executionStack = $state<ExecutionContext[]>([]);
	let timerId: any = null;
	let isWaitingClick = $state(false);

	// 初期化
	const resetPreviewState = () => {
		isPlaying = false;
		messageSpeaker = "";
		messageText = "";
		showMessageWindow = false;
		activeCharacters = {};
		selectChoices = [];
		executionStack = [];
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
		isWaitingClick = false;
	};

	// プレビュー開始
	const startPreview = () => {
		resetPreviewState();
		isPlaying = true;
		
		// 現在のキャラクターの立ち位置などをストアからコピーして初期化
		const chars: Record<number, ActiveCharState> = {};
		for (const char of store.characters) {
			chars[char.id] = {
				id: char.id,
				name: char.name,
				x: char.x,
				y: char.y,
				imageUrl: char.imgur,
				visible: false, // 最初は非表示
				opacity: 0,
				isJumping: false,
				jumpType: null
			};
		}
		activeCharacters = chars;

		// 最初のコマンドスタック
		executionStack = [{ commands: store.commands, index: 0 }];
		playNext();
	};

	// プレビュー停止
	const stopPreview = () => {
		resetPreviewState();
	};

	// コマンドの実行処理
	const playNext = () => {
		if (!isPlaying) return;
		if (timerId) clearTimeout(timerId);

		// スタックが空なら再生終了
		if (executionStack.length === 0) {
			stopPreview();
			return;
		}

		const currentCtx = executionStack[executionStack.length - 1];

		// 現在のコンテキストのコマンドが終了していれば、スタックからpopして戻る
		if (currentCtx.index >= currentCtx.commands.length) {
			executionStack.pop();
			playNext();
			return;
		}

		const cmd = currentCtx.commands[currentCtx.index];
		currentCtx.index++; // インデックスを進める

		switch (cmd.type) {
			case "message":
				showMessageWindow = true;
				messageSpeaker = cmd.speaker;
				messageText = cmd.text;
				isWaitingClick = true;
				break;

			case "wait":
				isWaitingClick = false;
				timerId = setTimeout(() => {
					playNext();
				}, cmd.ms);
				break;

			case "character_action":
				const char = activeCharacters[cmd.charId];
				if (char) {
					// 表情画像の決定
					const charDef = store.characters.find((c) => c.id === cmd.charId);
					if (charDef) {
						char.imageUrl = (cmd.emotion && charDef.emotions[cmd.emotion]) 
							? charDef.emotions[cmd.emotion] 
							: charDef.imgur;
					}

					if (cmd.action === "fadeIn") {
						char.visible = true;
						char.opacity = 1;
						timerId = setTimeout(() => playNext(), 300); // フェード時間を待つ
					} else if (cmd.action === "fadeOut") {
						char.opacity = 0;
						timerId = setTimeout(() => {
							char.visible = false;
							playNext();
						}, 300);
					} else if (cmd.action === "change") {
						// 表情変更だけなら一瞬
						timerId = setTimeout(() => playNext(), 100);
					} else if (cmd.action === "jump1" || cmd.action === "jump2") {
						char.isJumping = true;
						char.jumpType = cmd.action;
						const jumpDuration = cmd.action === "jump1" ? 400 : 800;
						timerId = setTimeout(() => {
							char.isJumping = false;
							char.jumpType = null;
							playNext();
						}, jumpDuration);
					} else {
						playNext();
					}
				} else {
					playNext();
				}
				break;

			case "select":
				selectChoices = cmd.options;
				isWaitingClick = false; // クリック待ちマークは消す
				break;

			default:
				playNext();
		}
	};

	// 画面クリックでメッセージを進める
	const handleScreenClick = () => {
		if (isPlaying && isWaitingClick) {
			isWaitingClick = false;
			playNext();
		}
	};

	// 選択肢をクリックしたとき
	const handleSelectChoice = (option: SelectOption) => {
		selectChoices = [];
		// 選択された選択肢の子コマンドをスタックに積む
		executionStack.push({ commands: option.commands, index: 0 });
		playNext();
	};

	onDestroy(() => {
		if (timerId) clearTimeout(timerId);
	});
</script>

<div class="flex flex-col gap-2 w-full max-w-[500px]">
	<!-- プレビュー枠 -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="relative aspect-[4/3] w-full bg-black rounded-lg overflow-hidden border border-surface-400 shadow-lg cursor-pointer"
		onclick={handleScreenClick}
	>
		{#if !isPlaying}
			<!-- 再生前画面 -->
			<div class="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/90 text-white p-4 text-center">
				<p class="font-bold text-lg mb-2 text-primary-400">ビジュアルノベル プレビュー</p>
				<p class="text-xs opacity-75 mb-6">タイムラインのスクリプトを再生して確認できます</p>
				<button 
					type="button" 
					class="btn preset-filled-primary flex items-center gap-2 px-6 py-3 text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition"
					onclick={startPreview}
				>
					<PlayIcon size={20} class="fill-white" />
					プレビュー再生
				</button>
			</div>
		{:else}
			<!-- キャラクター表示レイヤー -->
			<div class="absolute inset-0 pb-16 flex items-end justify-center pointer-events-none">
				{#each Object.values(activeCharacters) as char (char.id)}
					{#if char.visible}
						<div 
							class="absolute bottom-0 w-24 h-48 flex flex-col justify-end transition-all duration-300 pointer-events-none"
							style="left: calc({char.x}% - 48px); opacity: {char.opacity};"
						>
							<img 
								src={char.imageUrl} 
								alt={char.name}
								class="w-full h-full object-contain origin-bottom"
								class:vn-jump1={char.isJumping && char.jumpType === "jump1"}
								class:vn-jump2={char.isJumping && char.jumpType === "jump2"}
							/>
						</div>
					{/if}
				{/each}
			</div>

			<!-- 選択肢レイヤー -->
			{#if selectChoices.length > 0}
				<div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 gap-2 z-10">
					{#each selectChoices as option}
						<button
							type="button"
							class="w-full max-w-[280px] px-4 py-2.5 bg-surface-800 hover:bg-primary-600 text-white rounded-lg border border-surface-600 shadow-md text-xs font-semibold text-center transition"
							onclick={() => handleSelectChoice(option)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{/if}

			<!-- メッセージウィンドウ -->
			{#if showMessageWindow}
				<div class="absolute bottom-2 left-2 right-2 bg-surface-950/85 text-white p-3 rounded-lg border border-surface-700/60 min-h-[72px] flex flex-col justify-between">
					<div>
						{#if messageSpeaker}
							<p class="font-bold text-xs text-secondary-300 mb-1">{messageSpeaker}</p>
						{/if}
						<p class="text-xs leading-relaxed opacity-95">{messageText}</p>
					</div>
					{#if isWaitingClick}
						<div class="flex justify-end">
							<ChevronRightIcon size={14} class="animate-bounce text-primary-400" />
						</div>
					{/if}
				</div>
			{/if}

			<!-- コントロールボタン（オーバーレイ） -->
			<div class="absolute top-2 right-2 flex items-center gap-1 z-20">
				<button 
					type="button" 
					class="btn-icon btn-sm bg-surface-900/80 text-white hover:bg-error-600 rounded-md p-1 shadow"
					title="停止"
					onclick={(e) => {
						e.stopPropagation();
						stopPreview();
					}}
				>
					<SquareIcon size={14} class="fill-white" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	/* ジャンプアニメーション */
	@keyframes vn-jump1 {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-24px) scaleY(1.05); }
	}
	@keyframes vn-jump2 {
		0%, 50%, 100% { transform: translateY(0); }
		25%, 75% { transform: translateY(-24px) scaleY(1.05); }
	}

	.vn-jump1 {
		animation: vn-jump1 0.4s ease-out;
	}
	.vn-jump2 {
		animation: vn-jump2 0.8s ease-out;
	}
</style>
