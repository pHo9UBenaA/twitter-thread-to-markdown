// TODO:
// フォーマット
// リンクなどでリッチなリンクの不要な情報を取得している
// 絵文字が画像に差し替えられている時にリンクが付いてたりする
// もっと見つけるで同じ人のツイートが出てきた時にコピーされてしまう
// コマンドで実行できるようにする

// リプ欄にあるプロモーションのツイートが取得されてしまう（プロモfーションと別の人のリプが同時に取得される事象があったのできちんと同期取れてないかも）->多分userElementsとtweetElementsの数が一致していない

import TurndownService from 'turndown';

const separator = '--';

const succeededMessage = '処理成功';
const failedMessage = '処理失敗';

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

const windowAlert = (message: string) => {
	window.alert(message);
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
	const targetUserNameElement = tweetElement.querySelector(
		'[data-testid="User-Name"]',
	);

	if (!targetUserNameElement) {
		throw new Error('抽出対象のスレッドのユーザー名が見つかりませんでした。');
	}

	return getUserName(targetUserNameElement);
};

const extractTweetText = (tweetElement: Element): string => {
	const textElement = tweetElement.querySelector('[data-testid="tweetText"]');

	const newLineReplacedTextElement =
		textElement?.innerHTML.replace(/(\r\n|\n|\r)/g, '<br>') ?? '';

	// TODO: aのリンクが短縮のままになっている。ハッシュタグがパスのみになっている。
	const turndownService = new TurndownService().addRule('img-filter', {
		filter: 'img',
		replacement: (content, node) => {
			if (node instanceof HTMLElement) {
				const alt = node.getAttribute('alt');
				return alt ?? '';
			}
			return '';
		},
	});
	const text = turndownService.turndown(newLineReplacedTextElement);

	return text;
};

const extractCardMediaLinkElement = async (
	cardMediaLinkElement: Element,
): Promise<string> => {
	const anchorHref = cardMediaLinkElement.querySelector('a')?.href;
	const title = cardMediaLinkElement.querySelector('span')?.textContent;
	if (!anchorHref || !title) {
		throw new Error('リンクまたはタイトルの取得に失敗しました。');
	}

	// const title = spanElement.textContent;
	const url = await getOriginalURL(anchorHref);

	return `[${title}](${url})`;
};

const extractCardWrapperLinkElement = async (
	cardWrapperLinkElement: Element,
): Promise<string> => {
	const anchorHref = cardWrapperLinkElement.querySelector('a')?.href;
	const title = cardWrapperLinkElement
		.querySelector('[data-testid="card.layoutSmall.detail"]')
		?.querySelectorAll('div')[1]
		?.querySelectorAll('span')[1]?.textContent;

	if (!anchorHref || !title) {
		console.log(anchorHref);
		console.log(title);
		throw new Error('リンクまたはタイトルの取得に失敗しました。');
	}

	const url = await getOriginalURL(anchorHref);

	return `[${title}](${url})`;
};

const extractTweetLink = async (tweetElement: Element): Promise<string> => {
	// // <div class="css-175oi2r r-1adg3ll r-2dkq44 r-1emcu8v" id="id__x8bb6gjx0yk" data-testid="card.layoutLarge.media"><a href="https://t.co/8T1cRDQnTS" rel="noopener noreferrer nofollow" target="_blank" aria-label="prtimes.jp 新しい福利厚生のHQ、20億円のシリーズB資金調達を実施。同時に7つの新プロダクトを発表" role="link" class="css-175oi2r r-1udh08x r-13qz1uu r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21"><div class="css-175oi2r r-1adg3ll r-1udh08x"><div class="r-1adg3ll r-13qz1uu" style="padding-bottom: 52.356%;"></div><div class="r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu"><div class="css-175oi2r r-1mlwlqe r-1udh08x r-417010 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af" style="margin: 0px;"><div class="css-175oi2r r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw r-4gszlv" style="background-image: url(&quot;https://pbs.twimg.com/card_img/1867041896943718400/lalPZ6uk?format=jpg&amp;name=medium&quot;);"></div><img alt="" draggable="true" src="https://pbs.twimg.com/card_img/1867041896943718400/lalPZ6uk?format=jpg&amp;name=medium" class="css-9pa8cd"></div></div></div><div class="css-175oi2r r-vznvhx r-rki7wi r-u8s1d r-14fd9ze"><div class="css-175oi2r r-1awozwy r-k200y r-z2wwpe r-z80fyv r-1777fci r-is05cd r-loe9s5 r-dnmrzs r-633pao"><div dir="ltr" class="css-146c3p1 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-qvutc0 r-1tl8opc r-fdjqy7 r-n6v787 r-1cwl3u0 r-16dba41 r-lrvibr" style="color: rgb(255, 255, 255); text-overflow: ellipsis;"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;">新しい福利厚生のHQ、20億円のシリーズB資金調達を実施。同時に7つの新プロダクトを発表</span></div></div></div></a></div>
	const cardMediaLinkElement = tweetElement.querySelector(
		'[data-testid="card.layoutLarge.media"]',
	);

	if (cardMediaLinkElement) {
		return await extractCardMediaLinkElement(cardMediaLinkElement);
	}

	// <div aria-labelledby="id__nopl8ir1a0d id__2rxp4kuwj5h" class="css-175oi2r r-1kqtdi0 r-1867qdf r-1phboty r-rs99b7 r-18u37iz r-1udh08x r-o7ynqc r-6416eg r-1ny4l3l" id="id__kp2dtsv4ygr" data-testid="card.wrapper"><div aria-hidden="true" class="css-175oi2r r-1kqtdi0 r-1phboty r-1adg3ll r-1udh08x r-2dkq44 r-1ua6aaf r-1nptdac" id="id__nopl8ir1a0d" data-testid="card.layoutSmall.media" style="width: calc(130px);"><a href="https://t.co/t8RCvTSViW" rel="noopener noreferrer nofollow" target="_blank" role="link" tabindex="-1" class="css-175oi2r r-1udh08x r-13qz1uu r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21"><div class="css-175oi2r r-1adg3ll r-1udh08x"><div class="r-1adg3ll r-13qz1uu" style="padding-bottom: 100%;"></div><div class="r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu"><div class="css-175oi2r r-1mlwlqe r-1udh08x r-417010 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af" style="margin: 0px;"><div class="css-175oi2r r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw r-4gszlv" style="background-image: url(&quot;https://pbs.twimg.com/card_img/1867509854501314560/GaQkKSo7?format=jpg&amp;name=small&quot;);"></div><img alt="" draggable="true" src="https://pbs.twimg.com/card_img/1867509854501314560/GaQkKSo7?format=jpg&amp;name=small" class="css-9pa8cd"></div></div></div></a></div><div class="css-175oi2r r-16y2uox r-1wbh5a2 r-1777fci"><a href="https://t.co/t8RCvTSViW" rel="noopener noreferrer nofollow" target="_blank" role="link" class="css-175oi2r r-18u37iz r-16y2uox r-1wtj0ep r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21"><div class="css-175oi2r r-16y2uox r-1wbh5a2 r-z5qs1h r-1777fci r-3o4zer r-ttdzmv r-kzbkwu" id="id__2rxp4kuwj5h" data-testid="card.layoutSmall.detail"><div dir="auto" class="css-146c3p1 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41" style="text-overflow: unset; color: rgb(113, 118, 123);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;">gigazine.net</span></span></div><div dir="auto" class="css-146c3p1 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41" style="text-overflow: unset; color: rgb(231, 233, 234);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;">漢字だらけの偽中国語しか投稿できない国産中華風SNS「対多」登場、匿名無料登録不要林檎端末泥端末両対応</span></span></div><div dir="auto" class="css-146c3p1 r-8akbws r-krxsd3 r-dnmrzs r-1udh08x r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41" style="-webkit-line-clamp: 2; text-overflow: unset; color: rgb(113, 118, 123);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc" style="text-overflow: unset;">SNS上では「我即退社」や「我五千兆円所持希望」といったような漢字のみを並べた偽中国語の投稿を見かけることがあります。そんな偽中国語専用の掲示板「対多(ツイタ)」がリリースされていたので、実際に使ってみました。</span></span></div></div></a></div></div>
	const cardWrapperLinkElement = tweetElement.querySelector(
		'[data-testid="card.wrapper"]',
	);

	// 観測している範囲で2パターンあった
	if (cardWrapperLinkElement) {
		return await extractCardWrapperLinkElement(cardWrapperLinkElement);
	}

	return '';
};

// const extractTweetVideoLink = (tweetElement: Element): string => {
// 	const tweetVideoLinkElement = tweetElement.querySelector(
// 		'[data-testid="card.layoutSmall.media"]',
// 	);
// 	if (!tweetVideoLinkElement) {
// 		return '';
// 	}

// 	const anchorHref = tweetVideoLinkElement.querySelector('a')?.href;
// 	if (!anchorHref) {
// 		throw new Error('リンクの取得に失敗しました。');
// 	}

// 	return anchorHref
// };

// const extractTweetPhotos = (tweetElement: Element): string => {
// 	const photoElements = tweetElement.querySelectorAll(
// 		'[data-testid="tweetPhoto"]',
// 	);

// 	if (photoElements.length < 1) {
// 		return '';
// 	}
// 	let photoString = '';
// 	for (let i = 0; i < photoElements.length; i++) {
// 		photoString += wrapWithNewline(photoElements[i]?.innerHTML);
// 	}
// 	return photoString;
// };

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
			wrapWithNewline(await extractTweetLink(tweetElements[i]));
		// wrapWithNewline(extractTweetVideoLink(tweetElements[i])) +
		// wrapWithNewline(extractTweetPhotos(tweetElements[i]));
	}

	return threadMarkdown;
};

const copyToClipboard = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
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
		windowAlert(succeededMessage);
	} catch (error) {
		console.error(error);
		windowAlert(failedMessage);
	}
};

if (!chrome.runtime.onMessage.hasListeners()) {
	chrome.runtime.onMessage.addListener((message) => {
		if (message.action === 'extractThread') {
			extractThread();
		}
	});
}
