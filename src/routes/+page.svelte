<script lang="ts">
	import { base } from "$app/paths";
	import { store } from "$lib/store.svelte";
	import { compileScene } from "$lib/compiler";
	import PreviewPart from "$lib/components/PreviewPart.svelte";
	import TimelinePart from "$lib/components/TimelinePart.svelte";
	import ManualPart from "$lib/components/ManualPart.svelte";
	import PresetPart from "$lib/components/PresetPart.svelte";
	import { 
		UndoIcon, RedoIcon, DownloadIcon, UploadIcon, CopyIcon, 
		PlusIcon, Trash2Icon, UserPlusIcon, SettingsIcon, CodeIcon,
		FileTextIcon, CheckIcon
	} from "@lucide/svelte";

	// リアルタイムにコンパイルされたコードをリアクティブに生成
	let compiledCode = $derived(
		compileScene(store.sceneSettings, store.characters, store.commands)
	);

	let newCharName = $state("");
	let activeCharTab = $state<number | null>(null);
	let fileInput = $state<HTMLInputElement>();

	// 表情追加用の一時状態
	let newEmotionName = $state<Record<number, string>>({});
	let newEmotionUrl = $state<Record<number, string>>({});

	// キャラクターの追加
	const addCharacter = () => {
		const name = newCharName.trim();
		if (!name) return;

		const nextId = store.characters.length > 0 
			? Math.max(...store.characters.map(c => c.id)) + 1 
			: 1;
		
		if (nextId > 50) {
			alert("キャラクターは最大50人まで登録できます。");
			return;
		}

		const newChar = {
			id: nextId,
			name,
			x: 50,
			y: 40,
			imgur: `${base}/momoi.png`,
			emotions: {
				"通常": `${base}/momoi.png`
			}
		};

		store.characters = [...store.characters, newChar];
		newCharName = "";
		activeCharTab = newChar.id;
		store.saveHistory();
	};

	// キャラクターの削除
	const deleteCharacter = (id: number) => {
		if (confirm("このキャラクターを削除しますか？\n（タイムラインに存在するこのキャラクターの操作コマンドは動作しなくなります）")) {
			store.characters = store.characters.filter(c => c.id !== id);
			if (activeCharTab === id) activeCharTab = null;
			store.saveHistory();
		}
	};

	// キャラクター表情の追加
	const addEmotion = (charId: number) => {
		const name = newEmotionName[charId]?.trim();
		const url = newEmotionUrl[charId]?.trim();
		if (!name || !url) return;

		const char = store.characters.find(c => c.id === charId);
		if (char) {
			char.emotions[name] = url;
			store.characters = [...store.characters];
			newEmotionName[charId] = "";
			newEmotionUrl[charId] = "";
			store.saveHistory();
		}
	};

	// キャラクター表情の削除
	const deleteEmotion = (charId: number, emotionName: string) => {
		if (emotionName === "通常") {
			alert("「通常」表情は削除できません。");
			return;
		}
		const char = store.characters.find(c => c.id === charId);
		if (char) {
			delete char.emotions[emotionName];
			store.characters = [...store.characters];
			store.saveHistory();
		}
	};

	// プロジェクトデータのインポート
	const triggerUpload = () => {
		fileInput?.click();
	};

	const handleImport = (e: Event) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			if (store.importJson(text)) {
				alert("プロジェクトデータをインポートしました。");
			} else {
				alert("インポートに失敗しました。正しいJSONファイルかご確認ください。");
			}
		};
		reader.readAsText(file);
	};

	// プロジェクトデータのエクスポート
	const handleExport = () => {
		const json = store.exportJson();
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${store.sceneSettings.id || "scene"}_project.json`;
		a.click();
	};

	// クリップボードにコピー
	let copySuccess = $state(false);
	const copyToClipboard = () => {
		navigator.clipboard.writeText(compiledCode).then(() => {
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		});
	};

	// RPGENスクリプトファイルのダウンロード
	const downloadRpgenScript = () => {
		const blob = new Blob([compiledCode], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${store.sceneSettings.id || "scene"}_event.txt`;
		a.click();
	};

	// 履歴保存の汎用ハンドラ
	const handleGenericChange = () => {
		store.saveHistory();
	};
</script>

<div class="grid h-screen grid-rows-[auto_1fr] bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100">
	<!-- ヘッダー -->
	<header class="bg-surface-100 dark:bg-surface-900 border-b border-surface-300 dark:border-surface-800 p-2.5 px-4 flex flex-wrap items-center justify-between gap-4">
		<!-- 左側: タイトル -->
		<div class="flex items-center gap-3">
			<img
				src="{base}/momoi.png"
				alt="Momoi Icon"
				class="w-10 h-10 object-contain bg-white rounded-full border border-surface-300 shadow-sm"
			/>
			<div>
				<h1 class="font-black text-lg text-primary-600 dark:text-primary-400 leading-tight">VNメモ帳</h1>
				<p class="text-xxs opacity-65 leading-none">ビジュアルノベルスクリプト作成ツール</p>
			</div>
		</div>

		<!-- 中央: ツールバー (Undo, Redo, Import, Export) -->
		<div class="flex items-center gap-2">
			<!-- 履歴管理 -->
			<div class="flex items-center bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5 border border-surface-300 dark:border-surface-700">
				<button
					type="button"
					class="btn-icon btn-sm hover:preset-tonal"
					disabled={!store.canUndo}
					onclick={() => store.undo()}
					title="元に戻す (Undo)"
				>
					<UndoIcon size={16} />
				</button>
				<button
					type="button"
					class="btn-icon btn-sm hover:preset-tonal"
					disabled={!store.canRedo}
					onclick={() => store.redo()}
					title="やり直す (Redo)"
				>
					<RedoIcon size={16} />
				</button>
			</div>

			<!-- ファイル操作 -->
			<div class="flex items-center bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5 border border-surface-300 dark:border-surface-700">
				<input 
					type="file" 
					accept=".json" 
					class="hidden" 
					bind:this={fileInput} 
					onchange={handleImport} 
				/>
				<button
					type="button"
					class="btn-icon btn-sm hover:preset-tonal"
					onclick={triggerUpload}
					title="プロジェクトJSONをインポート"
				>
					<UploadIcon size={16} />
				</button>
				<button
					type="button"
					class="btn-icon btn-sm hover:preset-tonal"
					onclick={handleExport}
					title="プロジェクトJSONをエクスポート"
				>
					<DownloadIcon size={16} />
				</button>
			</div>
		</div>

		<!-- 右側: 外部パーツ (プリセット, マニュアル) -->
		<div class="flex items-center gap-2">
			<PresetPart />
			<ManualPart />
		</div>
	</header>

	<!-- コンテンツエリア -->
	<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] overflow-hidden">
		<!-- 左サイドバー (キャラクター管理) -->
		<aside class="bg-surface-100 dark:bg-surface-900 border-r border-surface-300 dark:border-surface-800 flex flex-col overflow-y-auto">
			<div class="p-3 border-b border-surface-300 dark:border-surface-800">
				<h2 class="font-bold text-sm flex items-center gap-1.5 text-primary-500">
					<UserPlusIcon size={16} />
					キャラクター管理
				</h2>
			</div>

			<!-- キャラクター新規登録 -->
			<div class="p-3 border-b border-surface-300 dark:border-surface-800 bg-surface-200/40 dark:bg-surface-800/20">
				<div class="input-group grid-cols-[1fr_auto]">
					<input 
						type="text" 
						class="ig-input" 
						placeholder="キャラクターの名前..." 
						maxlength="16"
						bind:value={newCharName}
						onkeydown={(e) => e.key === "Enter" && addCharacter()}
					/>
					<button 
						class="ig-btn preset-filled-primary" 
						onclick={addCharacter}
						disabled={!newCharName.trim()}
					>
						<PlusIcon size={16} />
					</button>
				</div>
			</div>

			<!-- キャラクター一覧 -->
			<div class="flex-1 p-3 space-y-2">
				{#if store.characters.length === 0}
					<p class="text-xs text-center opacity-60 py-8">登録されたキャラクターはいません。</p>
				{:else}
					{#each store.characters as char (char.id)}
						<div class="card p-2 bg-surface-200/50 dark:bg-surface-800/40 border border-surface-300 dark:border-surface-700/80 rounded-lg">
							<!-- ヘッダー部分 -->
							<button 
								type="button"
								class="w-full flex items-center justify-between text-left font-bold text-xs"
								onclick={() => activeCharTab = activeCharTab === char.id ? null : char.id}
							>
								<div class="flex items-center gap-2">
									<span class="w-5 h-5 flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xxs font-black rounded">
										{char.id}
									</span>
									<span>{char.name}</span>
								</div>
								<span class="text-xxs opacity-50">
									{activeCharTab === char.id ? "▲ 閉じる" : "▼ 編集"}
								</span>
							</button>

							<!-- アコーディオ編集エリア -->
							{#if activeCharTab === char.id}
								<div class="space-y-3 pt-3 mt-2 border-t border-surface-300 dark:border-surface-700 text-xxs">
									<!-- 名前変更 -->
									<label class="flex flex-col gap-1">
										<span class="opacity-75">表示名:</span>
										<input 
											type="text" 
											class="input input-xs input-bordered bg-white dark:bg-surface-900 font-semibold"
											bind:value={char.name}
											onblur={handleGenericChange}
										/>
									</label>

									<!-- 立ち位置設定 -->
									<div class="grid grid-cols-2 gap-2">
										<label class="flex flex-col gap-1">
											<span class="opacity-75">配置位置 X (%):</span>
											<input 
												type="number" 
												class="input input-xs input-bordered bg-white dark:bg-surface-900 text-right"
												min="0" max="100"
												bind:value={char.x}
												onblur={handleGenericChange}
											/>
										</label>
										<label class="flex flex-col gap-1">
											<span class="opacity-75">配置位置 Y (%):</span>
											<input 
												type="number" 
												class="input input-xs input-bordered bg-white dark:bg-surface-900 text-right"
												min="0" max="100"
												bind:value={char.y}
												onblur={handleGenericChange}
											/>
										</label>
									</div>

									<!-- 基本画像URL -->
									<label class="flex flex-col gap-1">
										<span class="opacity-75">基本画像URL (デフォルト):</span>
										<input 
											type="text" 
											class="input input-xs input-bordered bg-white dark:bg-surface-900 font-mono"
											placeholder="Imgurやローカル画像パス"
											bind:value={char.imgur}
											onblur={handleGenericChange}
										/>
									</label>

									<!-- 表情マップ -->
									<div class="space-y-1.5">
										<span class="opacity-75 font-bold">表情リスト:</span>
										<div class="space-y-1 max-h-24 overflow-y-auto border border-surface-300 dark:border-surface-700 rounded p-1.5 bg-white dark:bg-surface-900">
											{#each Object.entries(char.emotions) as [emoName, emoUrl]}
												<div class="flex items-center justify-between gap-1 border-b border-surface-200 dark:border-surface-800 pb-0.5 mb-0.5 last:border-0 last:pb-0 last:mb-0">
													<span class="font-bold max-w-[8ch] truncate">{emoName}</span>
													<span class="opacity-50 truncate flex-1 pl-1 font-mono text-[9px]">{emoUrl}</span>
													<button 
														type="button" 
														class="text-error-500 hover:text-error-600 p-0.5" 
														disabled={emoName === "通常"}
														onclick={() => deleteEmotion(char.id, emoName)}
													>
														<Trash2Icon size={10} />
													</button>
												</div>
											{/each}
										</div>

										<!-- 表情追加 -->
										<div class="grid grid-cols-[80px_1fr_auto] gap-1 items-center pt-1 border-t border-dashed border-surface-300 dark:border-surface-750">
											<input 
												type="text" 
												class="input input-xs input-bordered bg-white dark:bg-surface-900 font-semibold"
												placeholder="表情名"
												bind:value={newEmotionName[char.id]}
											/>
											<input 
												type="text" 
												class="input input-xs input-bordered bg-white dark:bg-surface-900"
												placeholder="画像URL"
												bind:value={newEmotionUrl[char.id]}
											/>
											<button 
												type="button"
												class="btn btn-xs preset-filled-primary px-1.5"
												onclick={() => addEmotion(char.id)}
											>
												<PlusIcon size={10} />
											</button>
										</div>
									</div>

									<!-- 削除ボタン -->
									<div class="pt-2 border-t border-surface-300 dark:border-surface-700 flex justify-end">
										<button 
											type="button" 
											class="btn btn-xs preset-tonal-error flex items-center gap-1 font-bold"
											onclick={() => deleteCharacter(char.id)}
										>
											<Trash2Icon size={10} />
											キャラクター削除
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</aside>

		<!-- メインキャンバスエリア (プレビュー & タイムライン) -->
		<main class="flex flex-col overflow-hidden border-r border-surface-300 dark:border-surface-800">
			<!-- 上部: プレビュー画面 -->
			<div class="p-4 flex justify-center items-center bg-surface-200/30 dark:bg-surface-900/10 border-b border-surface-300 dark:border-surface-800">
				<PreviewPart />
			</div>

			<!-- 下部: タイムライン編集 -->
			<div class="flex-1 overflow-y-auto p-4">
				<div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-300 dark:border-surface-800">
					<h2 class="font-bold text-sm flex items-center gap-1.5 text-secondary-500">
						<FileTextIcon size={16} />
						シナリオ タイムライン
					</h2>
					<span class="text-xxs opacity-60">コマンド数: {store.commands.length}</span>
				</div>
				
				<TimelinePart bind:commands={store.commands} />
			</div>
		</main>

		<!-- 右サイドバー (設定とコンパイル出力) -->
		<aside class="bg-surface-100 dark:bg-surface-900 overflow-y-auto flex flex-col">
			<!-- 設定エリア -->
			<div class="p-3 border-b border-surface-300 dark:border-surface-800">
				<h2 class="font-bold text-sm flex items-center gap-1.5 text-secondary-500">
					<SettingsIcon size={16} />
					シーン設定
				</h2>
			</div>
			
			<div class="p-3 space-y-3 text-xs border-b border-surface-300 dark:border-surface-800">
				<label class="flex flex-col gap-1">
					<span class="opacity-75">シーンID (半角英数):</span>
					<input 
						type="text" 
						class="input input-sm input-bordered bg-white dark:bg-surface-900 font-mono"
						bind:value={store.sceneSettings.id}
						onblur={handleGenericChange}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="opacity-75">シーンタイトル:</span>
					<input 
						type="text" 
						class="input input-sm input-bordered bg-white dark:bg-surface-900 font-semibold"
						bind:value={store.sceneSettings.title}
						onblur={handleGenericChange}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="opacity-75">シーン概要:</span>
					<textarea 
						class="textarea textarea-sm textarea-bordered bg-white dark:bg-surface-900"
						rows="2"
						bind:value={store.sceneSettings.synopsis}
						onblur={handleGenericChange}
					></textarea>
				</label>

				<!-- イベント位置とトリガー -->
				<div class="grid grid-cols-2 gap-2">
					<label class="flex flex-col gap-1">
						<span class="opacity-75">イベント位置 TX:</span>
						<input 
							type="number" 
							class="input input-sm input-bordered bg-white dark:bg-surface-900 text-right"
							bind:value={store.sceneSettings.tx}
							onblur={handleGenericChange}
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="opacity-75">イベント位置 TY:</span>
						<input 
							type="number" 
							class="input input-sm input-bordered bg-white dark:bg-surface-900 text-right"
							bind:value={store.sceneSettings.ty}
							onblur={handleGenericChange}
						/>
					</label>
				</div>
				<label class="flex flex-col gap-1">
					<span class="opacity-75">イベント起動トリガー:</span>
					<select 
						class="select select-sm select-bordered bg-white dark:bg-surface-900"
						bind:value={store.sceneSettings.trigger}
						onchange={handleGenericChange}
					>
						<option value="touch">接触 (プレイヤーが触れたら起動)</option>
						<option value="check">決定キー (目の前で決定キーを押したら起動)</option>
					</select>
				</label>
			</div>

			<!-- コンパイル出力エリア -->
			<div class="p-3 border-b border-surface-300 dark:border-surface-800 bg-surface-200/30 dark:bg-surface-800/10">
				<h2 class="font-bold text-sm flex items-center gap-1.5 text-primary-500">
					<CodeIcon size={16} />
					RPGENコード出力
				</h2>
			</div>

			<div class="flex-1 p-3 flex flex-col gap-2.5 min-h-[250px] overflow-hidden">
				<textarea 
					class="textarea textarea-bordered bg-white dark:bg-surface-900 font-mono text-[9px] leading-tight flex-1 w-full resize-none"
					readonly
					value={compiledCode}
				></textarea>
				
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						class="btn btn-sm flex items-center justify-center gap-1.5 transition font-semibold rounded-lg shadow-sm"
						class:preset-filled-primary={!copySuccess}
						class:preset-filled-success={copySuccess}
						onclick={copyToClipboard}
					>
						{#if copySuccess}
							<CheckIcon size={14} />
							コピー完了
						{:else}
							<CopyIcon size={14} />
							コードをコピー
						{/if}
					</button>
					<button
						type="button"
						class="btn btn-sm preset-tonal-secondary flex items-center justify-center gap-1.5 hover:preset-filled-secondary transition font-semibold rounded-lg shadow-sm"
						onclick={downloadRpgenScript}
					>
						<DownloadIcon size={14} />
						TXT保存
					</button>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	/* 追加のスタイル微調整 */
	:global(.ig-input) {
		font-size: 0.75rem !important;
	}
	.text-xxs {
		font-size: 0.7rem;
	}
	.text-xxs {
		font-size: 0.7rem;
	}
</style>
