// manifest.json
const commandId = 'extract-thread';

const contextMenuId = 'extractThread';

// content.ts
const scriptActionName = 'extractThread';

chrome.runtime.onInstalled.addListener(() => {
	const removeAll = () => {
		chrome.contextMenus.removeAll();
	};

	const create = () => {
		chrome.contextMenus.create({
			id: contextMenuId,
			title: 'スレッドを抽出',
		});
	};

	removeAll();
	create();
});

chrome.commands.onCommand.addListener((command, tab) => {
	if (command === commandId && tab?.id !== undefined) {
		executeScripts(tab.id);
	}
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId === contextMenuId && tab?.id !== undefined) {
		executeScripts(tab.id);
	}
});

const executeScripts = (tabId: number) => {
	try {
		chrome.scripting.executeScript(
			{ target: { tabId: tabId }, files: ['content.js'] },
			() => {
				chrome.tabs.sendMessage(tabId, { action: scriptActionName });
			},
		);
	} catch (err) {
		console.error('スレッドの抽出に失敗しました: ', err);
	}
};
