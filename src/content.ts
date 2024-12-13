// TODO:
// フォーマット
// リンクなどでリッチなリンクの不要な情報を取得している
// リプ欄にあるプロモーションのツイートが取得されてしまう（プロモfーションと別の人のリプが同時に取得される事象があったのできちんと同期取れてないかも）->多分userElementsとtweetElementsの数が一致していない
// 絵文字が別のものに差し替えられている時にリンクが付いてたりする
// もっと見つけるで同じ人のツイートが出てきた時にコピーされてしまう

import TurndownService from 'turndown';

const separator = '--';

const succeededMessage = '処理成功';
const failedMessage = '処理失敗';

const turndownService = new TurndownService();

const wrapWithNewline = (text: string | null | undefined): string => {
	if (!text) return '';
	return `\n${text}\n`;
};

const getOriginalURL = async (shortenedURL: string) => {
	try {
		const response = await fetch(shortenedURL);
		// sample: <head><noscript><META http-equiv="refresh" content="0;URL=https://prtimes.jp/main/html/rd/p/000000105.000089608.html"></noscript><title>https://prtimes.jp/main/html/rd/p/000000105.000089608.html</title></head><script>window.opener = null; location.replace("https:\/\/prtimes.jp\/main\/html\/rd\/p\/000000105.000089608.html")</script>
		const html = await response.text();
		const match = html.match(/<title>(.*?)<\/title>/);
		if (!match?.[1]) {
			throw new Error('オリジナルURLの取得に失敗しました');
		}
		return match[1];
	} catch (error) {
		console.error(error);
		throw new Error('エラー');
	}
};

const getUserName = (element: Element): string | null | undefined => {
	const divElements = element.querySelectorAll('div');
	// ユーザー名とIDで2つの要素が入っているはず
	if (divElements.length < 2) {
		return null;
	}
	// 1つ目の要素がユーザー名、2つ目の要素がユーザーIDのはず
	const spanElement = divElements[1].querySelector('span');

	return spanElement?.textContent;
};

/** 一番大元のツイートのユーザー名を取得 */
const getParentUserName = (): string => {
	const errorMessage = '抽出対象のツイートのユーザー名が見つかりませんでした。';

	const parentUserElement = document.querySelector('[data-testid="User-Name"]');

	if (!parentUserElement) {
		throw new Error(errorMessage);
	}

	const result = getUserName(parentUserElement);

	if (!result) {
		throw new Error(errorMessage);
	}

	return result;
};

const extractTweetUserName = (
	tweetElement: Element,
): string | null | undefined => {
	const targetUserElement = tweetElement.querySelector(
		'[data-testid="User-Name"]',
	);

	if (!targetUserElement) {
		throw new Error('抽出対象のスレッドのユーザー名が見つかりませんでした。');
	}

	return getUserName(targetUserElement);
};

const extractTweetText = (tweetElement: Element): string => {
	const tweetTextElement = tweetElement.querySelector(
		'[data-testid="tweetText"]',
	);

	const newLineReplacedTweetTextElement =
		tweetTextElement?.innerHTML.replace(/(\r\n|\n|\r)/g, '<br>') ?? '';

	const tweetText = turndownService.turndown(newLineReplacedTweetTextElement);

	return tweetText;
};

const extractTweetLink = async (tweetElement: Element): Promise<string> => {
	const tweetLinkElement = tweetElement.querySelector(
		'[data-testid="card.layoutLarge.media"]',
	);

	if (!tweetLinkElement) {
		return '';
	}

	const anchorElement = tweetLinkElement.querySelector('a');
	const spanElement = tweetLinkElement.querySelector('span');

	if (!anchorElement || !spanElement?.textContent) {
		// <div class="css-175oi2r r-1adg3ll r-2dkq44 r-1emcu8v" id="id__x8bb6gjx0yk" data-testid="card.layoutLarge.media"><a href="https://t.co/8T1cRDQnTS" rel="noopener noreferrer nofollow" target="_blank" aria-label="prtimes.jp 新しい福利厚生のHQ、20億円のシリーズB資金調達を実施。同時に7つの新プロダクトを発表" role="link" class="css-175oi2r r-1udh08x r-13qz1uu r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21"><div class="css-175oi2r r-1adg3ll r-1udh08x"><div class="r-1adg3ll r-13qz1uu" style="padding-bottom: 52.356%;"></div><div class="r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu"><div class="css-175oi2r r-1mlwlqe r-1udh08x r-417010 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af" style="margin: 0px;"><div class="css-175oi2r r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw r-4gszlv" style="background-image: url(&quot;https://pbs.twimg.com/card_img/1867041896943718400/lalPZ6uk?format=jpg&amp;name=medium&quot;);"></div><img alt="" draggable="true" src="https://pbs.twimg.com/card_img/1867041896943718400/lalPZ6uk?format=jpg&amp;name=medium" class="css-9pa8cd"></div></div></div><div class="css-175oi2r r-vznvhx r-rki7wi r-u8s1d r-14fd9ze"><div class="css-175oi2r r-1awozwy r-k200y r-z2wwpe r-z80fyv r-1777fci r-is05cd r-loe9s5 r-dnmrzs r-633pao"><div dir="ltr" class="css-146c3p1 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-qvutc0 r-1tl8opc r-fdjqy7 r-n6v787 r-1cwl3u0 r-16dba41 r-lrvibr" style="color: rgb(255, 255, 255); text-overflow: ellipsis;"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;">新しい福利厚生のHQ、20億円のシリーズB資金調達を実施。同時に7つの新プロダクトを発表</span></div></div></div></a></div>
		throw new Error('ツイートのリンクが想定していない形になっている');
	}

	const title = spanElement.textContent;
	const url = await getOriginalURL(anchorElement.href);

	return `[${title}](${url})`;
};

const extractTweetVideoLink = (tweetElement: Element): string | null => {
	const tweetVideoLinkElement = tweetElement.querySelector(
		'[data-testid="card.layoutSmall.media"]',
	);
	if (!tweetVideoLinkElement) {
		return null;
	}
	const anchorElement = tweetVideoLinkElement.querySelector('a');
	return anchorElement ? anchorElement.href : null;
};

const extractTweetPhotos = (tweetElement: Element): string => {
	const tweetPhotoElements = tweetElement.querySelectorAll(
		'[data-testid="tweetPhoto"]',
	);

	if (tweetPhotoElements.length < 1) {
		return '';
	}
	let tweetPhotoString = '';
	for (let i = 0; i < tweetPhotoElements.length; i++) {
		tweetPhotoString += wrapWithNewline(tweetPhotoElements[i]?.innerHTML);
	}
	return tweetPhotoString;
};

const generateThreadMarkdown = async (
	parentUserName: string,
): Promise<string> => {
	const tweetElements = document.querySelectorAll('[data-testid="tweet"]');

	if (tweetElements.length < 1) {
		return '';
	}

	let threadMarkdown = '';
	for (let i = 0; i < tweetElements.length; i++) {
		// 対応: 引用ツイートが別の人だったりすると取得できなかったりする（querySelectorAllでUser-Nameを取得していた）
		const tweetUserName = extractTweetUserName(tweetElements[i]);
		if (parentUserName !== tweetUserName) {
			break; // 他の人のリプライまたは他の人へのリプライに到達した想定
		}

		if (i > 0) threadMarkdown += wrapWithNewline(separator);
		threadMarkdown +=
			wrapWithNewline(extractTweetText(tweetElements[i])) +
			wrapWithNewline(await extractTweetLink(tweetElements[i])) +
			wrapWithNewline(extractTweetVideoLink(tweetElements[i])) +
			wrapWithNewline(extractTweetPhotos(tweetElements[i]));
	}

	return threadMarkdown;
};

const copyToClipboard = async (text: string): Promise<void> => {
	try {
		navigator.clipboard.writeText(text);
	} catch (error) {
		console.error(error);
		throw new Error('クリップボードへのコピーが失敗しました。');
	}
};

const extractThread = async (): Promise<void> => {
	try {
		const parentUserName = getParentUserName();
		const threadMarkdown = await generateThreadMarkdown(parentUserName);
		await copyToClipboard(threadMarkdown);
		alert(succeededMessage);
	} catch (error) {
		console.error(error);
		alert(failedMessage);
	}
};

if (!chrome.runtime.onMessage.hasListeners()) {
	chrome.runtime.onMessage.addListener((message) => {
		if (message.action === 'extractThread') {
			extractThread();
		}
	});
}
