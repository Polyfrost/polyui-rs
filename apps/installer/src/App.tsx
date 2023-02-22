import { getDebugState, hooks, queryClient } from '@polyui/client';
import { KeybindEvent, OperatingSystem, Platform, PlatformProvider } from '@polyui/interface';
import '@polyui/ui/style';
import { loggerLink } from '@rspc/client';
import { tauriLink } from '@rspc/tauri';
import { dialog, invoke, os, shell } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import LanguageSelect from './components/Language';

const client = hooks.createClient({
	links: [
		loggerLink({
			enabled: () => getDebugState().rspcLogger
		}),
		tauriLink()
	]
});

async function getOs(): Promise<OperatingSystem> {
	switch (await os.type()) {
		case 'Linux':
			return 'linux';
		case 'Windows_NT':
			return 'windows';
		case 'Darwin':
			return 'macOS';
		default:
			return 'unknown';
	}
}

const platform: Platform = {
	platform: 'tauri',
	openLink: shell.open,
	getOs,
	openDirectoryPickerDialog: () => dialog.open({ directory: true }),
	openFilePickerDialog: () => dialog.open(),
	saveFilePickerDialog: () => dialog.save(),
	showDevtools: () => invoke('show_devtools'),
	openPath: (path) => shell.open(path)
};

export default function App() {
	useEffect(() => {
		invoke('app_ready');
	}, []);

	useEffect(() => {
		const keybindListener = listen('keybind', (input) => {
			document.dispatchEvent(new KeybindEvent(input.payload as string));
		});

		return () => {
			keybindListener.then((unlisten) => unlisten());
		};
	}, []);

	return (
		<hooks.Provider client={client} queryClient={queryClient}>
			<PlatformProvider platform={platform}>
				<LanguageSelect />
			</PlatformProvider>
		</hooks.Provider>
	);
}
