<script lang="ts">
	import { store, type AppCommand, type CommandType, type SelectOption } from "$lib/store.svelte";
	import TimelinePart from "./TimelinePart.svelte";
	import { 
		PlusIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, 
		CopyIcon, MessageSquareIcon, ClockIcon, UserIcon, GitForkIcon 
	} from "@lucide/svelte";

	let { 
		commands = $bindable(), 
		isNested = false 
	}: {
		commands: AppCommand[];
		isNested?: boolean;
	} = $props();

	// 固有のID生成
	const genId = () => "cmd-" + Math.random().toString(36).substring(2, 11);

	// コマンドの追加
	const addCommand = (type: CommandType) => {
		let newCmd: AppCommand;
		
		if (type === "message") {
			newCmd = {
				id: genId(),
				type: "message",
				speaker: store.characters[0]?.name || "",
				text: "セリフを入力してください。"
			};
		} else if (type === "wait") {
			newCmd = {
				id: genId(),
				type: "wait",
				ms: 1000
			};
		} else if (type === "character_action") {
			newCmd = {
				id: genId(),
				type: "character_action",
				charId: store.characters[0]?.id || 1,
				action: "fadeIn",
				emotion: "通常"
			};
		} else if (type === "select") {
			newCmd = {
				id: genId(),
				type: "select",
				options: [
					{ label: "はい", commands: [] },
					{ label: "いいえ", commands: [] }
				]
			};
		} else {
			return;
		}

		commands = [...commands, newCmd];
		store.saveHistory();
	};

	// コマンドの削除
	const deleteCommand = (index: number) => {
		commands = commands.filter((_, i) => i !== index);
		store.saveHistory();
	};

	// コマンドの複製
	const duplicateCommand = (index: number) => {
		const clone = JSON.parse(JSON.stringify(commands[index]));
		clone.id = genId();
		commands = [
			...commands.slice(0, index + 1),
			clone,
			...commands.slice(index + 1)
		];
		store.saveHistory();
	};

	// 順序の入れ替え（上へ）
	const moveUp = (index: number) => {
		if (index === 0) return;
		const nextCmds = [...commands];
		const temp = nextCmds[index];
		nextCmds[index] = nextCmds[index - 1];
		nextCmds[index - 1] = temp;
		commands = nextCmds;
		store.saveHistory();
	};

	// 順序の入れ替え（下へ）
	const moveDown = (index: number) => {
		if (index === commands.length - 1) return;
		const nextCmds = [...commands];
		const temp = nextCmds[index];
		nextCmds[index] = nextCmds[index + 1];
		nextCmds[index + 1] = temp;
		commands = nextCmds;
		store.saveHistory();
	};

	// 選択肢の追加
	const addOption = (cmdIndex: number) => {
		const cmd = commands[cmdIndex];
		if (cmd.type === "select") {
			cmd.options = [...cmd.options, { label: "新しい選択肢", commands: [] }];
			commands = [...commands];
			store.saveHistory();
		}
	};

	// 選択肢の削除
	const deleteOption = (cmdIndex: number, optIndex: number) => {
		const cmd = commands[cmdIndex];
		if (cmd.type === "select" && cmd.options.length > 2) {
			cmd.options = cmd.options.filter((_, i) => i !== optIndex);
			commands = [...commands];
			store.saveHistory();
		}
	};

	// キャラクター変更時の表情デフォルト設定
	const handleCharChange = (cmdIndex: number, charIdStr: string) => {
		const cmd = commands[cmdIndex];
		if (cmd.type === "character_action") {
			const charId = parseInt(charIdStr, 10);
			cmd.charId = charId;
			const char = store.characters.find(c => c.id === charId);
			if (char) {
				const emotions = Object.keys(char.emotions);
				cmd.emotion = emotions.includes("通常") ? "通常" : (emotions[0] || "");
			}
			commands = [...commands];
			store.saveHistory();
		}
	};

	// 汎用保存トリガー
	const triggerSave = () => {
		store.saveHistory();
	};
</script>

<div class="space-y-4 w-full">
	{#if commands.length === 0}
		<div class="flex flex-col items-center justify-center py-8 border-2 border-dashed border-surface-400 rounded-xl opacity-60">
			<p class="text-xs">タイムラインは空です。下のボタンからコマンドを追加してください。</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each commands as cmd, i (cmd.id)}
				<div class="card p-3 bg-surface-100 dark:bg-surface-800/80 border border-surface-300 dark:border-surface-700 shadow-sm flex flex-col gap-2 relative">
					<!-- コマンドヘッダー -->
					<div class="flex justify-between items-center border-b pb-1 border-surface-300 dark:border-surface-700">
						<div class="flex items-center gap-1.5 font-bold text-xs text-surface-700 dark:text-surface-300">
							{#if cmd.type === "message"}
								<MessageSquareIcon size={14} class="text-blue-500" />
								<span>メッセージ表示</span>
							{:else if cmd.type === "wait"}
								<ClockIcon size={14} class="text-yellow-600 dark:text-yellow-400" />
								<span>一時ウェイト</span>
							{:else if cmd.type === "character_action"}
								<UserIcon size={14} class="text-green-500" />
								<span>キャラクター操作</span>
							{:else if cmd.type === "select"}
								<GitForkIcon size={14} class="text-purple-500" />
								<span>選択肢分岐</span>
							{/if}
						</div>
						
						<!-- コントロールボタン -->
						<div class="flex items-center gap-1">
							<button 
								type="button" 
								class="btn-icon btn-sm hover:preset-tonal"
								disabled={i === 0}
								onclick={() => moveUp(i)}
								title="上へ"
							>
								<ArrowUpIcon size={12} />
							</button>
							<button 
								type="button" 
								class="btn-icon btn-sm hover:preset-tonal"
								disabled={i === commands.length - 1}
								onclick={() => moveDown(i)}
								title="下へ"
							>
								<ArrowDownIcon size={12} />
							</button>
							<button 
								type="button" 
								class="btn-icon btn-sm hover:preset-tonal text-secondary-500"
								onclick={() => duplicateCommand(i)}
								title="複製"
							>
								<CopyIcon size={12} />
							</button>
							<button 
								type="button" 
								class="btn-icon btn-sm hover:preset-tonal text-error-500"
								onclick={() => deleteCommand(i)}
								title="削除"
							>
								<Trash2Icon size={12} />
							</button>
						</div>
					</div>

					<!-- コマンドコンテンツ -->
					<div class="text-xs">
						{#if cmd.type === "message"}
							<div class="grid grid-cols-[80px_1fr] gap-2 items-center">
								<select 
									class="select select-sm select-bordered bg-white dark:bg-surface-900"
									bind:value={cmd.speaker}
									onchange={triggerSave}
								>
									<option value="">（地の文）</option>
									{#each store.characters as char}
										<option value={char.name}>{char.name}</option>
									{/each}
								</select>
								<input 
									type="text" 
									class="input input-sm input-bordered bg-white dark:bg-surface-900 w-full"
									placeholder="セリフテキストを入力..."
									bind:value={cmd.text}
									onblur={triggerSave}
								/>
							</div>

						{:else if cmd.type === "wait"}
							<div class="flex items-center gap-2">
								<span class="opacity-75">待機時間:</span>
								<input 
									type="number" 
									class="input input-sm input-bordered bg-white dark:bg-surface-900 w-24 text-right"
									min="0"
									step="100"
									bind:value={cmd.ms}
									onblur={triggerSave}
								/>
								<span class="opacity-75">ミリ秒 (1000ms = 1秒)</span>
							</div>

						{:else if cmd.type === "character_action"}
							<div class="flex flex-wrap items-center gap-2">
								<span class="opacity-75">キャラクター:</span>
								<select 
									class="select select-sm select-bordered bg-white dark:bg-surface-900"
									value={cmd.charId}
									onchange={(e) => handleCharChange(i, e.currentTarget.value)}
								>
									{#each store.characters as char}
										<option value={char.id}>{char.name} (ID:{char.id})</option>
									{/each}
								</select>

								<span class="opacity-75">アクション:</span>
								<select 
									class="select select-sm select-bordered bg-white dark:bg-surface-900"
									bind:value={cmd.action}
									onchange={triggerSave}
								>
									<option value="fadeIn">フェードイン (登場)</option>
									<option value="fadeOut">フェードアウト (退場)</option>
									<option value="change">表情変更のみ</option>
									<option value="jump1">ジャンプ1回</option>
									<option value="jump2">ジャンプ2回</option>
								</select>

								{#if cmd.action !== "fadeOut"}
									<span class="opacity-75">表情:</span>
									<select 
										class="select select-sm select-bordered bg-white dark:bg-surface-900"
										bind:value={cmd.emotion}
										onchange={triggerSave}
									>
										{#if store.characters.find(c => c.id === cmd.charId)}
											{#each Object.keys(store.characters.find(c => c.id === cmd.charId)!.emotions) as emotion}
												<option value={emotion}>{emotion}</option>
											{/each}
										{:else}
											<option value="通常">通常</option>
										{/if}
									</select>
								{/if}
							</div>

						{:else if cmd.type === "select"}
							<div class="space-y-3 pt-1">
								<p class="opacity-70 text-xxs mb-1">選択肢の分岐先ストーリーを構築します（2〜4分岐まで）。</p>
								
								<div class="space-y-4 pl-2 border-l-2 border-purple-500/30">
									{#each cmd.options as option, optIdx}
										<div class="space-y-2 bg-surface-200/50 dark:bg-surface-900/30 p-2.5 rounded-lg border border-surface-300 dark:border-surface-700/60">
											<div class="flex justify-between items-center gap-2">
												<div class="flex items-center gap-1.5 flex-1">
													<span class="font-bold text-purple-600 dark:text-purple-400">選択肢 {optIdx + 1}:</span>
													<input 
														type="text" 
														class="input input-xs input-bordered bg-white dark:bg-surface-900 flex-1 font-semibold"
														bind:value={option.label}
														onblur={triggerSave}
													/>
												</div>
												{#if cmd.options.length > 2}
													<button 
														type="button" 
														class="btn-icon btn-xs text-error-500 hover:preset-tonal"
														onclick={() => deleteOption(i, optIdx)}
														title="選択肢を削除"
													>
														<Trash2Icon size={10} />
													</button>
												{/if}
											</div>
											
											<!-- 選択肢の子タイムライン（再帰） -->
											<div class="pl-2 pt-1 border-l border-dashed border-surface-400/50">
												<TimelinePart bind:commands={option.commands} isNested={true} />
											</div>
										</div>
									{/each}
								</div>

								{#if cmd.options.length < 4}
									<button 
										type="button" 
										class="btn btn-xs preset-tonal-purple flex items-center gap-1 mt-1 font-semibold rounded-md"
										onclick={() => addOption(i)}
									>
										<PlusIcon size={10} />
										選択肢を追加
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- コマンド追加用ボタン群 -->
	<div class="flex flex-wrap gap-1.5 pt-2 {isNested ? 'justify-start' : 'justify-center border-t border-surface-300 dark:border-surface-700/60 mt-3'}">
		<button 
			type="button" 
			class="btn btn-xs preset-tonal-primary flex items-center gap-1 py-1 rounded-md font-semibold text-[10px]"
			onclick={() => addCommand("message")}
		>
			<PlusIcon size={10} />
			会話メッセージ
		</button>
		<button 
			type="button" 
			class="btn btn-xs preset-tonal-secondary flex items-center gap-1 py-1 rounded-md font-semibold text-[10px]"
			onclick={() => addCommand("character_action")}
		>
			<PlusIcon size={10} />
			キャラ操作
		</button>
		<button 
			type="button" 
			class="btn btn-xs preset-tonal-warning flex items-center gap-1 py-1 rounded-md font-semibold text-[10px]"
			onclick={() => addCommand("wait")}
		>
			<PlusIcon size={10} />
			ウェイト
		</button>
		<button 
			type="button" 
			class="btn btn-xs preset-tonal-tertiary flex items-center gap-1 py-1 rounded-md font-semibold text-[10px]"
			onclick={() => addCommand("select")}
		>
			<PlusIcon size={10} />
			選択肢
		</button>
	</div>
</div>
