import '@polyui/ui/style';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import '~/patches';
import App from './App';

if (import.meta.env.DEV) {
	var script = document.createElement('script');
	script.src = 'http://localhost:8097';
	document.head.appendChild(script);
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<Suspense>
			<App />
		</Suspense>
	</React.StrictMode>
);
