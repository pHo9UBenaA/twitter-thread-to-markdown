const extractThreadId = 'extractThread';

chrome.runtime.onInstalled.addListener(() => {
	const removeAll = () => {
		chrome.contextMenus.removeAll();
	};

	const create = () => {
		chrome.contextMenus.create({
			id: extractThreadId,
			title: 'スレッドを抽出',
			contexts: ['all'],
		});
	};

	removeAll();
	create();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId === extractThreadId && tab?.id !== undefined) {
		try {
			chrome.scripting.executeScript(
				{
					target: { tabId: tab.id },
					files: ['content.js'],
				},
				() => {
					if (!tab.id) return;
					// content.jsにデータ取得の指示を送る
					chrome.tabs.sendMessage(tab.id, { action: 'extractThread' });
				},
			);

		} catch (err) {
			console.error('スレッドの抽出に失敗しました: ', err);
		}
	}
});
