import * as easing from "$lib/easing";

type EmotionMap = Record<string, string>;

interface CharacterOptions {
	id: number;
	x: number;
	y: number;
	imgur: string;
	emotions: EmotionMap;
}

export class Character {
	id: number;
	x: number;
	y: number;
	imgur: string;
	emotions: EmotionMap;

	constructor({ id, x, y, imgur, emotions }: CharacterOptions) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.imgur = imgur;
		this.emotions = emotions;
	}

	setEmotion(emotion?: string): void {
		if (emotion) {
			this.imgur = this.emotions[emotion] ?? this.imgur;
		}
	}

	fadeIn(emotion?: string): string {
		this.setEmotion(emotion);
		return easing.fadeInCharacter(this);
	}

	fadeOut(): string {
		return easing.fadeOutCharacter(this);
	}

	change(emotion?: string): string {
		this.setEmotion(emotion);
		return easing.changeCharacter(this);
	}

	jump1(emotion?: string): string {
		this.setEmotion(emotion);
		return easing.jumpCharacter({ ...this, count: 1 });
	}

	jump2(emotion?: string): string {
		this.setEmotion(emotion);
		return easing.jumpCharacter({ ...this, count: 2 });
	}
}
