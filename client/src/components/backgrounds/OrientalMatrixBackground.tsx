import { memo } from 'react';
import './backgrounds.css';

const KATAKANA_CHARS = [
    'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
    'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
    'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ガ', 'ギ', 'グ', 'ゲ',
    'ゴ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ',
    'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'
];

// Generate a larger set of characters for the grid
const generateChars = (count: number) => {
    const chars: string[] = [];
    for (let i = 0; i < count; i++) {
        chars.push(KATAKANA_CHARS[i % KATAKANA_CHARS.length]);
    }
    return chars;
};

const OrientalMatrixBackground = memo(() => {
    const chars = generateChars(600); // ~700 characters for full screen coverage

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden">
            <div className="jp-matrix">
                {chars.map((char, index) => (
                    <span key={index}>{char}</span>
                ))}
            </div>
        </div>
    );
});

OrientalMatrixBackground.displayName = 'OrientalMatrixBackground';

export default OrientalMatrixBackground;
